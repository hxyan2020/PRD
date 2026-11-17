"use client";

import { useId, useMemo } from "react";
import { useT } from "@/hooks/useUiLocale";

export type HistoryDay = {
  report_date: string;
  alerts_raised: number;
  breaches: number;
  warns: number;
  loss_usd: number;
  prevented_usd: number;
  exposure_usd: number;
  avg_ack_minutes: number | null;
  avg_resolve_minutes: number | null;
  open_eod: number;
  source: string;
};

type SeriesDef = {
  key: keyof HistoryDay;
  label: string;
  color: string;
  fill?: string;
};

function usdCompact(n: number) {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (abs >= 1000) return `$${(n / 1000).toFixed(0)}k`;
  return `$${Math.round(n)}`;
}

function niceMax(raw: number) {
  if (raw <= 0) return 1;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const n = raw / pow;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return step * pow;
}

function pathFor(
  points: Array<{ x: number; y: number }>,
  closedBottom?: { y: number }
) {
  if (!points.length) return "";
  let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  for (let i = 1; i < points.length; i++) {
    const p0 = points[i - 1];
    const p1 = points[i];
    const cx = (p0.x + p1.x) / 2;
    d += ` C ${cx.toFixed(1)} ${p0.y.toFixed(1)}, ${cx.toFixed(1)} ${p1.y.toFixed(1)}, ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}`;
  }
  if (closedBottom) {
    d += ` L ${points[points.length - 1].x.toFixed(1)} ${closedBottom.y.toFixed(1)} L ${points[0].x.toFixed(1)} ${closedBottom.y.toFixed(1)} Z`;
  }
  return d;
}

function SeriesChart({
  title,
  hint,
  history,
  series,
  formatY,
  height = 200,
}: {
  title: string;
  hint?: string;
  history: HistoryDay[];
  series: SeriesDef[];
  formatY: (n: number) => string;
  height?: number;
}) {
  const gid = useId().replace(/:/g, "");
  const width = 720;
  const pad = { top: 16, right: 12, bottom: 28, left: 48 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;

  const { maxY, pointsByKey, xLabels, yTicks } = useMemo(() => {
    const vals = history.flatMap((d) =>
      series.map((s) => {
        const v = d[s.key];
        return typeof v === "number" && Number.isFinite(v) ? v : 0;
      })
    );
    const maxY = niceMax(Math.max(...vals, 1));
    const n = Math.max(history.length - 1, 1);
    const pointsByKey: Record<string, Array<{ x: number; y: number }>> = {};
    for (const s of series) {
      pointsByKey[s.key] = history.map((d, i) => {
        const raw = d[s.key];
        const v = typeof raw === "number" && Number.isFinite(raw) ? raw : 0;
        return {
          x: pad.left + (i / n) * innerW,
          y: pad.top + innerH - (v / maxY) * innerH,
        };
      });
    }
    const labelEvery = history.length > 60 ? 14 : history.length > 30 ? 7 : 5;
    const xLabels = history
      .map((d, i) => ({ i, date: d.report_date }))
      .filter(({ i }) => i === 0 || i === history.length - 1 || i % labelEvery === 0)
      .map(({ i, date }) => ({
        x: pad.left + (i / n) * innerW,
        label: date.slice(5),
      }));
    const yTicks = [0, 0.25, 0.5, 0.75, 1].map((p) => ({
      y: pad.top + innerH * (1 - p),
      label: formatY(maxY * p),
    }));
    return { maxY, pointsByKey, xLabels, yTicks };
  }, [history, series, formatY, innerH, innerW, pad.left, pad.top]);

  if (!history.length) return null;

  return (
    <div className="panel p-3 sm:p-4 min-w-0">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold">{title}</h3>
          {hint ? <p className="text-sm text-[var(--muted)] mt-0.5">{hint}</p> : null}
        </div>
        <div className="flex flex-wrap gap-3 text-xs">
          {series.map((s) => (
            <span key={String(s.key)} className="inline-flex items-center gap-1.5 text-[var(--muted)]">
              <span className="inline-block h-2 w-3 rounded-sm" style={{ background: s.color }} />
              {s.label}
            </span>
          ))}
        </div>
      </div>
      <div className="mt-3 overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full min-w-[520px] h-auto"
          role="img"
          aria-label={title}
        >
          {yTicks.map((t) => (
            <g key={t.label}>
              <line
                x1={pad.left}
                x2={width - pad.right}
                y1={t.y}
                y2={t.y}
                stroke="var(--line)"
                strokeWidth={1}
              />
              <text x={pad.left - 8} y={t.y + 3} textAnchor="end" className="fill-[var(--muted)]" fontSize={10}>
                {t.label}
              </text>
            </g>
          ))}
          {series.map((s, idx) => {
            const pts = pointsByKey[s.key] || [];
            const gradId = `${gid}-g${idx}`;
            return (
              <g key={String(s.key)}>
                {s.fill ? (
                  <>
                    <defs>
                      <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={s.color} stopOpacity={0.28} />
                        <stop offset="100%" stopColor={s.color} stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <path d={pathFor(pts, { y: pad.top + innerH })} fill={`url(#${gradId})`} stroke="none" />
                  </>
                ) : null}
                <path d={pathFor(pts)} fill="none" stroke={s.color} strokeWidth={2.25} strokeLinejoin="round" />
              </g>
            );
          })}
          {xLabels.map((l) => (
            <text
              key={`${l.label}-${l.x}`}
              x={l.x}
              y={height - 8}
              textAnchor="middle"
              className="fill-[var(--muted)]"
              fontSize={10}
            >
              {l.label}
            </text>
          ))}
          <text x={pad.left} y={12} className="fill-[var(--muted)]" fontSize={10}>
            max {formatY(maxY)}
          </text>
        </svg>
      </div>
    </div>
  );
}

export function RiskLogCharts({ history }: { history: HistoryDay[] }) {
  const { t } = useT();
  const totals = useMemo(() => {
    const alerts = history.reduce((a, d) => a + d.alerts_raised, 0);
    const breaches = history.reduce((a, d) => a + d.breaches, 0);
    const loss = history.reduce((a, d) => a + d.loss_usd, 0);
    const prevented = history.reduce((a, d) => a + d.prevented_usd, 0);
    const backfilled = history.filter((d) => d.source === "backfill").length;
    return { alerts, breaches, loss, prevented, backfilled, days: history.length };
  }, [history]);

  if (!history.length) {
    return (
      <div className="panel p-4 text-sm text-[var(--muted)]" data-testid="risk-log-history-empty">
        {t("rl.histEmpty")}
      </div>
    );
  }

  const start = history[0].report_date;
  const end = history[history.length - 1].report_date;

  return (
    <div className="space-y-3" data-testid="risk-log-history-charts">
      <div className="panel p-3 sm:p-4">
        <h3 className="font-semibold">{t("rl.histTitle")}</h3>
        <p className="text-sm text-[var(--muted)] mt-1">{t("rl.histHint")}</p>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--muted)]">
          <span>
            {start} → {end} · {t("rl.histDays", { n: totals.days })}
          </span>
          <span>{t("rl.histBackfilled", { n: totals.backfilled })}</span>
          <span>
            {t("rl.alerts")} {totals.alerts} · {t("rl.breaches")} {totals.breaches}
          </span>
          <span>
            {t("rl.loss")} {usdCompact(totals.loss)} · {t("rl.prevented")} {usdCompact(totals.prevented)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
        <SeriesChart
          title={t("rl.chartAlerts")}
          hint={t("rl.chartAlertsHint")}
          history={history}
          formatY={(n) => String(Math.round(n))}
          series={[
            { key: "alerts_raised", label: t("rl.alertsRaised"), color: "#0f766e", fill: "1" },
            { key: "breaches", label: t("rl.breaches"), color: "#c2410c" },
            { key: "open_eod", label: t("rl.openEod"), color: "#475569" },
          ]}
        />
        <SeriesChart
          title={t("rl.chartMoney")}
          hint={t("rl.chartMoneyHint")}
          history={history}
          formatY={usdCompact}
          series={[
            { key: "prevented_usd", label: t("rl.prevented"), color: "#0f766e", fill: "1" },
            { key: "loss_usd", label: t("rl.loss"), color: "#b91c1c" },
          ]}
        />
      </div>

      <SeriesChart
        title={t("rl.chartHandling")}
        hint={t("rl.chartHandlingHint")}
        history={history}
        formatY={(n) => `${Math.round(n)}m`}
        height={180}
        series={[
          { key: "avg_ack_minutes", label: t("rl.avgAckTitle"), color: "#0f766e", fill: "1" },
          { key: "avg_resolve_minutes", label: t("rl.avgResTitle"), color: "#b45309" },
        ]}
      />
    </div>
  );
}
