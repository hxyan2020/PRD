"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Badge, StatCard, StatusBadge } from "@/components/ui";
import { MonitorCode } from "@/components/MonitorCode";
import { SourceBrandMark } from "@/components/SourceBrandMark";
import { useUiLocale } from "@/hooks/useUiLocale";
import { navLabel, t } from "@/lib/i18n";
import { isPublicSnapshot, isStaticExport } from "@/lib/static-export";
import { runClientMarketIntelScan } from "@/lib/market-intel/demo-scan";
import { resolveSourceHealth } from "@/lib/market-intel/source-brand";
import { bumpNavBadge } from "@/lib/nav-badges";
import { MarketIntelPulse } from "@/components/MarketIntelPulse";
import { findingMentionsSymbol } from "@/lib/market-intel/pulse";
import { resolveFindingSources } from "@/lib/market-intel/article-links";
import { EVENT_TEMPLATES } from "@/lib/market-intel/sources";
import { IntelImpactBadge, RegionFlag } from "@/components/MarketIntelMeta";
import { formatMarketIntelMessage } from "@/lib/market-intel/format";

const MI_STORE = "crmp_mi_demo_v1";

type Finding = {
  id: number;
  finding_id: string;
  event_title: string;
  event_summary: string;
  geography: string;
  severity: string;
  products_json: string;
  sources_json: string;
  asset_classes_json: string;
  scanned_at: string;
  pushed_to_lark: number;
  lark_message_id: string | null;
  status: string;
};

type Scan = {
  scan_id: string;
  started_at: string;
  finished_at: string | null;
  sources_checked: number;
  findings_new: number;
  findings_pushed: number;
  high_impact_count: number;
  status: string;
  trigger_mode: string;
};

type Source = {
  source_key: string;
  name: string;
  channel_type: string;
  asset_classes_json: string;
  url: string | null;
  enabled: number;
  last_scraped_at: string | null;
  health_status?: string | null;
  health_detail?: string | null;
};

type Outbox = {
  id: number;
  finding_id: string;
  channel_chat_id: string;
  formatted_message: string;
  delivered: number;
  created_at: string;
};

type Indicator = {
  monitor_id: string;
  name: string;
  status: string;
  last_value: number | null;
  threshold_warn: number;
  threshold_breach: number;
  unit: string;
} | null;

type BoardState = {
  findings: Finding[];
  scans: Scan[];
  sources: Source[];
  outbox: Outbox[];
  indicator: Indicator;
  settings: Array<{ key: string; value: string }>;
};

function displayGeography(title: string, stored: string) {
  return EVENT_TEMPLATES.find((t) => t.event_title === title)?.geography || stored;
}

function formatFindingStamp(raw: string) {
  const ts = Date.parse(raw.includes("T") ? raw : `${raw.replace(" ", "T")}Z`);
  if (!Number.isFinite(ts)) return raw;
  return `${new Date(ts).toISOString().slice(0, 19).replace("T", " ")} UTC`;
}

function displayOutboxMessage(
  findingId: string,
  stored: string,
  findings: Array<{
    finding_id: string;
    event_title: string;
    event_summary: string;
    geography: string;
    severity: string;
    products_json: string;
    sources_json: string;
    scanned_at: string;
  }>
) {
  const f = findings.find((x) => x.finding_id === findingId);
  if (!f) return stored.replace(/^\([ivx]+\)\s*/gim, "");
  let products: Array<{ product: string; asset_class: string; direction: "UP" | "DOWN" | "VOLATILE" }> = [];
  let sources: Array<{ name: string; url: string }> = [];
  try {
    products = JSON.parse(f.products_json || "[]");
  } catch {
    products = [];
  }
  try {
    sources = JSON.parse(f.sources_json || "[]");
  } catch {
    sources = [];
  }
  return formatMarketIntelMessage({
    finding_id: f.finding_id,
    event_title: f.event_title,
    event_summary: f.event_summary,
    geography: displayGeography(f.event_title, f.geography),
    severity: f.severity,
    products,
    timestamp: f.scanned_at,
    sources,
  });
}

type MiTab = "findings" | "messenger" | "sources" | "scans";

function isMiTab(v: string | null | undefined): v is MiTab {
  return v === "findings" || v === "messenger" || v === "sources" || v === "scans";
}

export function MarketIntelBoard({
  initial,
  initialTab,
}: {
  initial: BoardState;
  initialTab?: MiTab;
}) {
  const router = useRouter();
  const { locale } = useUiLocale();
  const [snapshot, setSnapshot] = useState(isStaticExport());
  const [tab, setTab] = useState<MiTab>(() => {
    if (initialTab && isMiTab(initialTab)) return initialTab;
    if (typeof window === "undefined") return "findings";
    const q = new URLSearchParams(window.location.search).get("tab");
    return isMiTab(q) ? q : "findings";
  });

  function goTab(next: MiTab) {
    setTab(next);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", next);
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
  }

  useEffect(() => {
    const apply = () => {
      const q = new URLSearchParams(window.location.search).get("tab");
      if (isMiTab(q)) setTab(q);
    };
    apply();
    window.addEventListener("popstate", apply);
    return () => window.removeEventListener("popstate", apply);
  }, []);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [findings, setFindings] = useState(initial.findings);
  const [scans, setScans] = useState(initial.scans);
  const [sources, setSources] = useState(initial.sources);
  const [outbox, setOutbox] = useState(initial.outbox);
  const [indicator, setIndicator] = useState(initial.indicator);
  const [settings, setSettings] = useState(initial.settings);
  const [openMsg, setOpenMsg] = useState<number | null>(initial.outbox[0]?.id ?? null);
  const [focusFinding, setFocusFinding] = useState<string | null>(null);
  const [productFilter, setProductFilter] = useState<string | null>(null);

  useEffect(() => {
    const publicHost = isPublicSnapshot();
    if (publicHost) setSnapshot(true);
    try {
      const raw = localStorage.getItem(MI_STORE);
      if (!raw) return;
      const saved = JSON.parse(raw) as Partial<BoardState>;
      if (Array.isArray(saved.findings) && saved.findings.length) setFindings(saved.findings);
      if (Array.isArray(saved.scans) && saved.scans.length) setScans(saved.scans);
      if (Array.isArray(saved.outbox) && saved.outbox.length) setOutbox(saved.outbox);
      if (Array.isArray(saved.sources) && saved.sources.length) setSources(saved.sources);
      if (saved.indicator) setIndicator(saved.indicator);
      if (Array.isArray(saved.settings) && saved.settings.length) setSettings(saved.settings);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!snapshot) return;
    try {
      localStorage.setItem(
        MI_STORE,
        JSON.stringify({ findings, scans, sources, outbox, indicator, settings })
      );
    } catch {
      /* ignore */
    }
  }, [snapshot, findings, scans, sources, outbox, indicator, settings]);

  const enabled = settings.find((s) => s.key === "market_intel.enabled")?.value !== "false";

  const highImpact = useMemo(
    () => findings.filter((f) => ["WARN", "BREACH", "CRITICAL"].includes(f.severity)).length,
    [findings]
  );

  const visibleFindings = useMemo(() => {
    if (!productFilter) return findings;
    return findings.filter((f) => findingMentionsSymbol(f.products_json, productFilter));
  }, [findings, productFilter]);

  function openFinding(findingId: string | null) {
    setProductFilter(null);
    setFocusFinding(findingId);
    goTab("findings");
  }

  function openSymbol(symbol: string) {
    setFocusFinding(null);
    setProductFilter((prev) => (prev === symbol ? null : symbol));
    goTab("findings");
  }

  useEffect(() => {
    if (tab !== "findings" || !focusFinding) return;
    const el = document.getElementById(`mi-finding-${focusFinding}`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [tab, focusFinding]);

  function applyDemoScan() {
    const demo = runClientMarketIntelScan({
      sourceCount: sources.length || 17,
      existingFindingIds: findings.map((f) => f.finding_id),
      trigger: "MANUAL",
    });
    setFindings((prev) => [...demo.findings, ...prev]);
    setScans((prev) => [...demo.scans, ...prev]);
    setOutbox((prev) => [...demo.outbox, ...prev]);
    setSources((prev) =>
      prev.map((s) => ({
        ...s,
        last_scraped_at: new Date().toISOString(),
        health_status: s.enabled ? "HEALTHY" : "DISABLED",
        health_detail: s.enabled ? "Demo scan touch" : s.health_detail,
      }))
    );
    if (indicator) {
      const hits = demo.high_impact_count;
      let status = indicator.status;
      if (hits >= indicator.threshold_breach) status = "BREACH";
      else if (hits >= indicator.threshold_warn) status = "WARN";
      else status = "HEALTHY";
      setIndicator({ ...indicator, last_value: hits, status });
    }
    goTab("findings");
    setMsg(
      t("mi.demoScan", locale, {
        scan_id: demo.scan_id,
        n: demo.findings_new,
        pushed: demo.findings_pushed,
      })
    );
    bumpNavBadge("/admin/market-intel", demo.findings_new);
    bumpNavBadge("/admin/messenger", demo.findings_pushed);
  }

  function toggleEnabledLocal() {
    const next = !enabled;
    setSettings((prev) => {
      const has = prev.some((s) => s.key === "market_intel.enabled");
      if (!has) return [...prev, { key: "market_intel.enabled", value: next ? "true" : "false" }];
      return prev.map((s) =>
        s.key === "market_intel.enabled" ? { ...s, value: next ? "true" : "false" } : s
      );
    });
    setMsg(next ? t("mi.schedOn", locale) : t("mi.schedOff", locale));
  }

  async function post(body: Record<string, unknown>) {
    setBusy(true);
    setMsg(null);
    setErr(null);
    try {
      if (snapshot || isPublicSnapshot()) {
        if (body.action === "toggle_enabled") toggleEnabledLocal();
        else applyDemoScan();
        return;
      }
      const res = await fetch("/api/market-intel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.status === 404 || res.status === 405) {
        setSnapshot(true);
        if (body.action === "toggle_enabled") toggleEnabledLocal();
        else applyDemoScan();
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(data.error || t("mi.failed", locale, { err: res.status }));
        return;
      }
      if (data.ok === false) {
        setErr(data.reason || data.error || t("mi.skipped", locale));
        return;
      }
      setMsg(
        data.scan_id
          ? t("mi.liveScan", locale, {
              id: data.scan_id,
              n: data.findings_new,
              pushed: data.findings_pushed,
            })
          : "OK"
      );
      bumpNavBadge("/admin/market-intel", Number(data.findings_new) || 1);
      bumpNavBadge("/admin/messenger", Number(data.findings_pushed) || 0);
      router.refresh();
    } catch {
      setSnapshot(true);
      if (body.action === "toggle_enabled") toggleEnabledLocal();
      else applyDemoScan();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="panel p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-[0.12em] text-[var(--muted)]">
              {t("mi.eyebrow", locale)}
            </div>
            <p className="text-sm mt-1 max-w-3xl">{t("mi.intro", locale)}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn btn-primary" disabled={busy} onClick={() => post({ action: "scan_now" })}>
              {busy ? t("mi.scanning", locale) : t("mi.scan", locale)}
            </button>
            <button
              type="button"
              className="btn"
              disabled={busy}
              onClick={() => post({ action: "toggle_enabled", enabled: !enabled })}
            >
              {enabled ? t("mi.disable", locale) : t("mi.enable", locale)}
            </button>
            <Link className="btn" href="/admin/skills/SKILL-MARKET-INTEL">
              {t("mi.playbook", locale)}
            </Link>
          </div>
        </div>
        {(msg || err) && (
          <div
            className={`mt-3 text-sm rounded-lg px-3 py-2 border ${
              err ? "bg-rose-50 border-rose-200 text-rose-900" : "bg-teal-50 border-teal-200 text-teal-900"
            }`}
          >
            {err || msg}
          </div>
        )}
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3" data-testid="mi-stat-cards">
        <StatCard
          onClick={() => goTab("findings")}
          label={t("mi.findings", locale)}
          value={findings.length}
          hint={`${highImpact} ${t("mi.highImpact", locale)}`}
          cta={t("mi.openFindings", locale)}
          tone={highImpact > 0 ? "alert" : "default"}
        />
        <StatCard
          href="/admin/monitor-2#M2-MKT-INTEL"
          label={t("mi.indicator", locale)}
          value={indicator?.last_value ?? "—"}
          hint={t("mi.warnBreach", locale, { w: indicator?.threshold_warn ?? 1, b: indicator?.threshold_breach ?? 3 })}
          cta={t("mi.openIndicator", locale)}
        />
        <StatCard
          onClick={() => goTab("sources")}
          label={t("mi.sources", locale)}
          value={sources.length}
          hint={enabled ? t("mi.schedOn", locale) : t("mi.schedOff", locale)}
          cta={t("mi.openSources", locale)}
        />
        <StatCard
          onClick={() => goTab("messenger")}
          label={t("mi.pushes", locale)}
          value={outbox.length}
          hint="oc_market_intelligence"
          cta={t("mi.openMessenger", locale)}
        />
      </div>

      <MarketIntelPulse
        findings={findings}
        onOpenFinding={openFinding}
        onOpenSymbol={openSymbol}
        activeSymbol={productFilter}
      />

      {indicator && (
        <div className="panel p-3 flex flex-wrap gap-2 items-center text-sm">
          <span className="text-xs uppercase text-[var(--muted)]">{t("mi.live", locale)}</span>
          <MonitorCode id={indicator.monitor_id} name={indicator.name} status={indicator.status} />
          <span>{indicator.name}</span>
          <StatusBadge value={indicator.status} />
          <Link className="underline text-xs" href="/admin/monitor-2#M2-MKT-INTEL">
            {navLabel("/admin/monitor-2", locale, "Monitor 2.0")}
          </Link>
          <Link className="underline text-xs" href="/admin/lark">
            {t("mi.larkChannels", locale)}
          </Link>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["findings", t("mi.tabFindings", locale)],
            ["messenger", t("mi.tabMessenger", locale)],
            ["sources", t("mi.tabSources", locale)],
            ["scans", t("mi.tabScans", locale)],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={`btn ${tab === id ? "btn-primary" : ""}`}
            data-testid={`mi-tab-${id}`}
            onClick={() => goTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "findings" && (
        <div className="space-y-3">
          {productFilter ? (
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span>{t("mi.filterSymbol", locale, { symbol: productFilter })}</span>
              <button type="button" className="btn" onClick={() => setProductFilter(null)}>
                {t("mi.clearFilter", locale)}
              </button>
            </div>
          ) : null}
          {visibleFindings.map((f) => {
            const products = JSON.parse(f.products_json || "[]") as Array<{
              product: string;
              asset_class: string;
              direction: string;
            }>;
            const findingSources = resolveFindingSources(f.event_title, f.sources_json);
            const geo = displayGeography(f.event_title, f.geography);
            return (
              <article
                key={f.id}
                id={`mi-finding-${f.finding_id}`}
                data-testid={`mi-finding-${f.finding_id}`}
                className={`panel p-4 ${
                  focusFinding === f.finding_id ? "ring-2 ring-teal-600/40 border-teal-400" : ""
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="text-xs text-[var(--muted)]">{f.finding_id}</div>
                    <h3 className="font-[family-name:var(--font-display)] text-lg">{f.event_title}</h3>
                    <p className="text-sm text-[var(--muted)] mt-1">{f.event_summary}</p>
                  </div>
                  <div className="flex flex-wrap gap-2 items-center">
                    <IntelImpactBadge severity={f.severity} />
                    <Badge className="bg-slate-100 text-slate-700 border-slate-200">
                      <RegionFlag geography={geo} />
                    </Badge>
                    {f.pushed_to_lark ? (
                      <Badge className="bg-teal-50 text-teal-900 border-teal-200">{t("mi.pushed", locale)}</Badge>
                    ) : null}
                  </div>
                </div>
                <div className="mt-3 grid md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-xs uppercase text-[var(--muted)]">{t("mi.productsDir", locale)}</div>
                    <ul className="mt-1 space-y-1">
                      {products.map((p, i) => (
                        <li key={i}>
                          <span className="font-medium">{p.product}</span> · {p.asset_class} ·{" "}
                          {p.direction === "UP"
                            ? t("mi.priceUp", locale)
                            : p.direction === "DOWN"
                              ? t("mi.priceDown", locale)
                              : t("mi.volatile", locale)}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <div className="text-xs uppercase text-[var(--muted)]">{t("mi.sourcesN", locale)}</div>
                    <ul className="mt-1 space-y-2">
                      {findingSources.map((s, i) => (
                        <li key={i} className="min-w-0">
                          <a className="underline font-medium break-words" href={s.url} target="_blank" rel="noreferrer">
                            {s.name}
                          </a>
                          <div className="text-[11px] text-[var(--muted)] break-all">
                            <a href={s.url} target="_blank" rel="noreferrer" className="hover:underline">
                              {s.url}
                            </a>
                          </div>
                        </li>
                      ))}
                    </ul>
                    <div className="text-xs text-[var(--muted)] mt-2 tabular-nums" data-testid="mi-finding-stamp">
                      {t("mi.timestamp", locale)} · {formatFindingStamp(f.scanned_at)}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
          {!visibleFindings.length && (
            <div className="panel p-6 text-sm text-[var(--muted)]">{t("mi.empty", locale)}</div>
          )}
        </div>
      )}

      {tab === "messenger" && (
        <div className="space-y-3">
          <p className="text-sm text-[var(--muted)]">
            {t("mi.formatHint", locale)}
          </p>
          {outbox.map((o) => (
            <article key={o.id} className="panel p-4">
              <button type="button" className="w-full text-left" onClick={() => setOpenMsg(openMsg === o.id ? null : o.id)}>
                <div className="flex flex-wrap gap-2 items-center text-sm">
                  <Badge className="bg-teal-50 text-teal-900 border-teal-200">{o.channel_chat_id}</Badge>
                  <span className="font-medium">{o.finding_id}</span>
                  <span className="text-xs text-[var(--muted)]">{o.created_at}</span>
                  {o.delivered ? <StatusBadge value="DELIVERED" /> : <StatusBadge value="PENDING" />}
                </div>
              </button>
              {openMsg === o.id && (
                <pre className="mt-3 text-xs whitespace-pre-wrap rounded-lg bg-slate-50 border border-[var(--line)] p-3">
                  {displayOutboxMessage(o.finding_id, o.formatted_message, findings)}
                </pre>
              )}
            </article>
          ))}
        </div>
      )}

      {tab === "sources" && (
        <div className="space-y-3" data-testid="mi-sources-table">
          <p className="text-sm text-[var(--muted)] px-1">{t("mi.sourceHealthHint", locale)}</p>
          <ul className="space-y-2 sm:hidden" data-testid="mi-sources-mobile">
            {sources.map((s) => {
              const health = resolveSourceHealth({
                enabled: s.enabled,
                last_scraped_at: s.last_scraped_at,
                health_status: s.health_status,
                source_key: s.source_key,
              });
              const detail = s.health_detail || health.detail;
              const assets = (JSON.parse(s.asset_classes_json || "[]") as string[]).join(", ");
              return (
                <li key={s.source_key} className="panel p-3 space-y-2" data-testid={`mi-source-${s.source_key}`}>
                  <div className="flex items-start gap-3">
                    <SourceBrandMark sourceKey={s.source_key} name={s.name} url={s.url} />
                    <div className="min-w-0 flex-1">
                      <div className="font-medium break-words">{s.name}</div>
                      {s.url ? (
                        <a
                          className="text-xs underline text-[var(--muted)] break-all"
                          href={s.url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {s.url}
                        </a>
                      ) : null}
                    </div>
                    <StatusBadge value={health.status} />
                  </div>
                  {detail ? <p className="text-[11px] text-[var(--muted)] leading-snug">{detail}</p> : null}
                  <div className="text-xs text-[var(--muted)]">
                    {s.channel_type}
                    {assets ? ` · ${assets}` : ""}
                  </div>
                  <div className="text-xs tabular-nums text-[var(--muted)]">
                    {t("mi.lastScraped", locale)}: {s.last_scraped_at || "—"}
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="panel overflow-x-auto hidden sm:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase text-[var(--muted)] border-b border-[var(--line)]">
                  <th className="p-3">{t("common.source", locale)}</th>
                  <th className="p-3">{t("mi.sourceHealth", locale)}</th>
                  <th className="p-3">{t("common.channel", locale)}</th>
                  <th className="p-3">{t("mi.assetClasses", locale)}</th>
                  <th className="p-3">{t("mi.lastScraped", locale)}</th>
                </tr>
              </thead>
              <tbody>
                {sources.map((s) => {
                  const health = resolveSourceHealth({
                    enabled: s.enabled,
                    last_scraped_at: s.last_scraped_at,
                    health_status: s.health_status,
                    source_key: s.source_key,
                  });
                  const detail = s.health_detail || health.detail;
                  return (
                    <tr key={s.source_key} className="border-b border-[var(--line)]" data-testid={`mi-source-row-${s.source_key}`}>
                      <td className="p-3">
                        <div className="flex items-start gap-3 min-w-[14rem]">
                          <SourceBrandMark sourceKey={s.source_key} name={s.name} url={s.url} />
                          <div className="min-w-0">
                            <div className="font-medium">{s.name}</div>
                            {s.url && (
                              <a
                                className="text-xs underline text-[var(--muted)] break-all"
                                href={s.url}
                                target="_blank"
                                rel="noreferrer"
                              >
                                {s.url}
                              </a>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <StatusBadge value={health.status} />
                        {detail ? (
                          <div className="text-[11px] text-[var(--muted)] mt-1 max-w-[14rem] leading-snug">
                            {detail}
                          </div>
                        ) : null}
                      </td>
                      <td className="p-3 whitespace-nowrap">{s.channel_type}</td>
                      <td className="p-3">
                        {(JSON.parse(s.asset_classes_json || "[]") as string[]).join(", ")}
                      </td>
                      <td className="p-3 text-[var(--muted)] whitespace-nowrap tabular-nums">
                        {s.last_scraped_at || "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "scans" && (
        <>
          <ul className="space-y-2 sm:hidden" data-testid="mi-scans-mobile">
            {scans.map((s) => (
              <li key={s.scan_id} className="panel p-3 space-y-2">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-medium break-all">{s.scan_id}</div>
                    <div className="text-xs text-[var(--muted)]">{s.started_at}</div>
                  </div>
                  <StatusBadge value={s.status} />
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[var(--muted)]">{t("mi.trigger", locale)}</span>
                    <div className="font-semibold">{s.trigger_mode}</div>
                  </div>
                  <div>
                    <span className="text-[var(--muted)]">{t("mi.sources", locale)}</span>
                    <div className="font-semibold tabular-nums">{s.sources_checked}</div>
                  </div>
                  <div>
                    <span className="text-[var(--muted)]">{t("mi.new", locale)}</span>
                    <div className="font-semibold tabular-nums">{s.findings_new}</div>
                  </div>
                  <div>
                    <span className="text-[var(--muted)]">{t("mi.tabMessenger", locale)}</span>
                    <div className="font-semibold tabular-nums">{s.findings_pushed}</div>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[var(--muted)]">{t("mi.highImpactCol", locale)}</span>
                    <div className="font-semibold tabular-nums">{s.high_impact_count}</div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <div className="panel overflow-x-auto hidden sm:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase text-[var(--muted)] border-b border-[var(--line)]">
                  <th className="p-3">{t("mi.scan", locale)}</th>
                  <th className="p-3">{t("mi.trigger", locale)}</th>
                  <th className="p-3">{t("mi.sources", locale)}</th>
                  <th className="p-3">{t("mi.new", locale)}</th>
                  <th className="p-3">{t("mi.tabMessenger", locale)}</th>
                  <th className="p-3">{t("mi.highImpactCol", locale)}</th>
                  <th className="p-3">{t("common.status", locale)}</th>
                </tr>
              </thead>
              <tbody>
                {scans.map((s) => (
                  <tr key={s.scan_id} className="border-b border-[var(--line)]">
                    <td className="p-3">
                      <div className="font-medium">{s.scan_id}</div>
                      <div className="text-xs text-[var(--muted)]">{s.started_at}</div>
                    </td>
                    <td className="p-3">{s.trigger_mode}</td>
                    <td className="p-3">{s.sources_checked}</td>
                    <td className="p-3">{s.findings_new}</td>
                    <td className="p-3">{s.findings_pushed}</td>
                    <td className="p-3">{s.high_impact_count}</td>
                    <td className="p-3">
                      <StatusBadge value={s.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
