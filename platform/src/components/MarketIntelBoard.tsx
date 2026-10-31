"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import Link from "next/link";
import { Badge, SeverityBadge, StatCard, StatusBadge } from "@/components/ui";

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

export function MarketIntelBoard({
  initial,
}: {
  initial: {
    findings: Finding[];
    scans: Scan[];
    sources: Source[];
    outbox: Outbox[];
    indicator: Indicator;
    settings: Array<{ key: string; value: string }>;
  };
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"findings" | "messenger" | "sources" | "scans">("findings");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [openMsg, setOpenMsg] = useState<number | null>(initial.outbox[0]?.id ?? null);

  const enabled =
    initial.settings.find((s) => s.key === "market_intel.enabled")?.value !== "false";

  const highImpact = useMemo(
    () => initial.findings.filter((f) => ["WARN", "BREACH", "CRITICAL"].includes(f.severity)).length,
    [initial.findings]
  );

  async function post(body: Record<string, unknown>) {
    setBusy(true);
    setMsg(null);
    setErr(null);
    try {
      const res = await fetch("/api/market-intel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(data.error || `Failed (${res.status})`);
        return;
      }
      setMsg(
        data.scan_id
          ? `Scan ${data.scan_id}: ${data.findings_new} new → ${data.findings_pushed} pushed to messenger`
          : "OK"
      );
      router.refresh();
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
              LP price-moving intelligence
            </div>
            <p className="text-sm mt-1 max-w-3xl">
              Scrapes news, social, official and exchange publications every{" "}
              <strong>5 minutes</strong> for forex, index, commodity, futures and crypto. Findings push to
              Lark group <code className="text-xs">oc_market_intelligence</code> in the standard card format,
              and feed indicator <Badge className="bg-orange-50 text-orange-900 border-orange-200">M2-MKT-INTEL</Badge>.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn btn-primary" disabled={busy} onClick={() => post({ action: "scan_now" })}>
              {busy ? "Scanning…" : "Scan now"}
            </button>
            <button
              type="button"
              className="btn"
              disabled={busy}
              onClick={() => post({ action: "toggle_enabled", enabled: !enabled })}
            >
              {enabled ? "Disable scheduler" : "Enable scheduler"}
            </button>
            <Link className="btn" href="/admin/skills">
              Skill playbook
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

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
        <StatCard label="Findings (loaded)" value={initial.findings.length} hint={`${highImpact} high-impact`} />
        <StatCard
          label="Indicator M2-MKT-INTEL"
          value={initial.indicator?.last_value ?? "—"}
          hint={`warn ${initial.indicator?.threshold_warn ?? 1} / breach ${initial.indicator?.threshold_breach ?? 3}`}
        />
        <StatCard label="Sources" value={initial.sources.length} hint={enabled ? "Scheduler ON" : "Scheduler OFF"} />
        <StatCard
          label="Messenger pushes"
          value={initial.outbox.length}
          hint="oc_market_intelligence"
        />
      </div>

      {initial.indicator && (
        <div className="panel p-3 flex flex-wrap gap-2 items-center text-sm">
          <span className="text-xs uppercase text-[var(--muted)]">Live indicator</span>
          <Badge className="bg-orange-50 text-orange-900 border-orange-200">{initial.indicator.monitor_id}</Badge>
          <span>{initial.indicator.name}</span>
          <StatusBadge value={initial.indicator.status} />
          <Link className="underline text-xs" href="/admin/monitor-2">
            Monitor 2.0
          </Link>
          <Link className="underline text-xs" href="/admin/lark">
            Lark channels
          </Link>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["findings", "Findings"],
            ["messenger", "Messenger outbox"],
            ["sources", "Sources"],
            ["scans", "Scan log"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={`btn ${tab === id ? "btn-primary" : ""}`}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "findings" && (
        <div className="space-y-3">
          {initial.findings.map((f) => {
            const products = JSON.parse(f.products_json || "[]") as Array<{
              product: string;
              asset_class: string;
              direction: string;
            }>;
            const sources = JSON.parse(f.sources_json || "[]") as Array<{ name: string; url: string }>;
            return (
              <article key={f.id} className="panel p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="text-xs text-[var(--muted)]">{f.finding_id}</div>
                    <h3 className="font-[family-name:var(--font-display)] text-lg">{f.event_title}</h3>
                    <p className="text-sm text-[var(--muted)] mt-1">{f.event_summary}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <SeverityBadge value={f.severity} />
                    <Badge className="bg-slate-100 text-slate-700 border-slate-200">{f.geography}</Badge>
                    {f.pushed_to_lark ? (
                      <Badge className="bg-teal-50 text-teal-900 border-teal-200">pushed</Badge>
                    ) : null}
                  </div>
                </div>
                <div className="mt-3 grid md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-xs uppercase text-[var(--muted)]">(iv) Products & direction</div>
                    <ul className="mt-1 space-y-1">
                      {products.map((p, i) => (
                        <li key={i}>
                          <span className="font-medium">{p.product}</span> · {p.asset_class} ·{" "}
                          {p.direction === "UP"
                            ? "price up"
                            : p.direction === "DOWN"
                              ? "price down"
                              : "volatile"}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <div className="text-xs uppercase text-[var(--muted)]">(vi) Sources</div>
                    <ul className="mt-1 space-y-1">
                      {sources.map((s, i) => (
                        <li key={i}>
                          <a className="underline" href={s.url} target="_blank" rel="noreferrer">
                            {s.name}
                          </a>
                        </li>
                      ))}
                    </ul>
                    <div className="text-xs text-[var(--muted)] mt-2">(v) {f.scanned_at}</div>
                  </div>
                </div>
              </article>
            );
          })}
          {!initial.findings.length && (
            <div className="panel p-6 text-sm text-[var(--muted)]">No findings yet — run Scan now.</div>
          )}
        </div>
      )}

      {tab === "messenger" && (
        <div className="space-y-3">
          <p className="text-sm text-[var(--muted)]">
            Dedicated group format: (i) event (ii) geography (iii) severity (iv) products+direction (v)
            timestamp (vi) sources with links.
          </p>
          {initial.outbox.map((o) => (
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
                  {o.formatted_message}
                </pre>
              )}
            </article>
          ))}
        </div>
      )}

      {tab === "sources" && (
        <div className="panel overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-[var(--muted)] border-b border-[var(--line)]">
                <th className="p-3">Source</th>
                <th className="p-3">Channel</th>
                <th className="p-3">Asset classes</th>
                <th className="p-3">Last scraped</th>
              </tr>
            </thead>
            <tbody>
              {initial.sources.map((s) => (
                <tr key={s.source_key} className="border-b border-[var(--line)]">
                  <td className="p-3">
                    <div className="font-medium">{s.name}</div>
                    {s.url && (
                      <a className="text-xs underline text-[var(--muted)]" href={s.url} target="_blank" rel="noreferrer">
                        {s.url}
                      </a>
                    )}
                  </td>
                  <td className="p-3">{s.channel_type}</td>
                  <td className="p-3">
                    {(JSON.parse(s.asset_classes_json || "[]") as string[]).join(", ")}
                  </td>
                  <td className="p-3 text-[var(--muted)]">{s.last_scraped_at || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "scans" && (
        <div className="panel overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-[var(--muted)] border-b border-[var(--line)]">
                <th className="p-3">Scan</th>
                <th className="p-3">Trigger</th>
                <th className="p-3">Sources</th>
                <th className="p-3">New</th>
                <th className="p-3">Pushed</th>
                <th className="p-3">High-impact</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {initial.scans.map((s) => (
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
      )}
    </div>
  );
}
