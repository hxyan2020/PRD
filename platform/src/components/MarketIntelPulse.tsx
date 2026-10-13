"use client";

import { Badge } from "@/components/ui";
import { IntelImpactBadge, RegionFlag } from "@/components/MarketIntelMeta";
import { useT } from "@/hooks/useUiLocale";
import { cn } from "@/lib/utils";
import {
  buildMarketPulse,
  PULSE_ASSET_ORDER,
  type PulseEvent,
  type PulseFinding,
  type SentimentTone,
} from "@/lib/market-intel/pulse";
import { EVENT_TEMPLATES } from "@/lib/market-intel/sources";
import { useMemo } from "react";

function toneBar(score: number) {
  return Math.min(96, Math.max(4, (score + 100) / 2));
}

function toneClass(tone: SentimentTone) {
  switch (tone) {
    case "BULLISH":
      return "bg-teal-50 text-teal-900 border-teal-200";
    case "BEARISH":
      return "bg-rose-50 text-rose-900 border-rose-200";
    case "MIXED":
      return "bg-amber-50 text-amber-900 border-amber-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

function EventCard({
  windowKey,
  event,
  onOpen,
}: {
  windowKey: "hour" | "day";
  event: PulseEvent | null;
  onOpen: (findingId: string | null) => void;
}) {
  const { t } = useT();
  return (
    <button
      type="button"
      className="panel card-link group p-4 text-left w-full"
      data-testid={`mi-pulse-${windowKey}`}
      onClick={() => onOpen(event?.finding_id ?? null)}
    >
      <div className="text-[11px] uppercase tracking-[0.08em] text-[var(--muted)]">
        {windowKey === "hour" ? t("mi.pulseHour") : t("mi.pulseDay")}
      </div>
      {event ? (
        <>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <IntelImpactBadge severity={event.severity} />
            <span className="text-xs text-[var(--muted)]">
              <RegionFlag
                geography={
                  EVENT_TEMPLATES.find((t) => t.event_title === event.event_title)?.geography || event.geography
                }
              />
            </span>
            <span className="text-xs tabular-nums text-[var(--muted)]">{event.scanned_at}</span>
          </div>
          <h3 className="mt-2 font-semibold leading-snug">{event.event_title}</h3>
          <p className="mt-1 text-sm text-[var(--muted)] line-clamp-3">{event.event_summary}</p>
          {event.products.length ? (
            <div className="mt-2 flex flex-wrap gap-1">
              {event.products.slice(0, 8).map((p) => (
                <Badge key={p} className="bg-slate-50 text-slate-800 border-slate-200">
                  {p}
                </Badge>
              ))}
            </div>
          ) : null}
          <div className="mt-3 text-xs font-semibold text-teal-800">{t("mi.pulseOpenFinding")}</div>
        </>
      ) : (
        <p className="mt-3 text-sm text-[var(--muted)]">{t("mi.pulseNoEvent")}</p>
      )}
    </button>
  );
}

export function MarketIntelPulse({
  findings,
  onOpenFinding,
  onOpenSymbol,
  activeSymbol = null,
}: {
  findings: PulseFinding[];
  onOpenFinding: (findingId: string | null) => void;
  onOpenSymbol: (symbol: string) => void;
  activeSymbol?: string | null;
}) {
  const { t, locale } = useT();
  const pulse = useMemo(() => buildMarketPulse(findings), [findings]);
  const zh = locale === "zh-Hant";

  return (
    <section className="space-y-3" data-testid="mi-pulse">
      <div>
        <h2 className="font-semibold">{t("mi.pulseTitle")}</h2>
        <p className="text-sm text-[var(--muted)] mt-0.5">{t("mi.pulseHint")}</p>
        {pulse.anchored ? (
          <p className="text-xs text-amber-800 mt-1">{t("mi.pulseAnchored")}</p>
        ) : null}
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        <EventCard windowKey="hour" event={pulse.hour} onOpen={onOpenFinding} />
        <EventCard windowKey="day" event={pulse.day} onOpen={onOpenFinding} />
      </div>

      <div className="panel p-4" data-testid="mi-sentiment">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h3 className="font-semibold">{t("mi.sentimentTitle")}</h3>
            <p className="text-sm text-[var(--muted)] mt-0.5">{t("mi.sentimentHint")}</p>
          </div>
          <div className="text-[11px] text-[var(--muted)]">{t("mi.sentimentScale")}</div>
        </div>
        {PULSE_ASSET_ORDER.map((cls) => {
          const rows = pulse.instruments.filter((inst) => inst.asset_class === cls);
          if (!rows.length) return null;
          return (
            <div key={cls} className="mt-4">
              <div className="text-[11px] uppercase tracking-[0.08em] text-[var(--muted)] mb-2">
                {t(`mi.class.${cls}`)}
              </div>
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-2">
                {rows.map((inst) => {
                  const pct = toneBar(inst.score);
                  const active = activeSymbol === inst.symbol;
                  return (
                    <button
                      key={inst.symbol}
                      type="button"
                      className={cn(
                        "rounded-xl border bg-white px-3 py-2.5 text-left",
                        active
                          ? "border-teal-500 ring-2 ring-teal-600/30"
                          : "border-[var(--line)] hover:border-teal-300"
                      )}
                      data-testid={`mi-sent-${inst.symbol}`}
                      onClick={() => onOpenSymbol(inst.symbol)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-semibold tabular-nums">{inst.symbol}</div>
                          <div className="text-[11px] text-[var(--muted)]">
                            {zh ? inst.name_zh : inst.name}
                          </div>
                        </div>
                        <Badge className={toneClass(inst.tone)}>{t(`mi.tone.${inst.tone}`)}</Badge>
                      </div>
                      <div className="mt-2 h-1.5 rounded-full bg-gradient-to-r from-rose-200 via-slate-200 to-teal-200 overflow-visible">
                        <div className="relative h-full">
                          <span
                            className={cn(
                              "absolute top-1/2 h-3 w-3 -translate-y-1/2 -translate-x-1/2 rounded-full border border-white shadow",
                              inst.tone === "BEARISH"
                                ? "bg-rose-600"
                                : inst.tone === "BULLISH"
                                  ? "bg-teal-700"
                                  : inst.tone === "MIXED"
                                    ? "bg-amber-500"
                                    : "bg-slate-500"
                            )}
                            style={{ left: `${pct}%` }}
                          />
                        </div>
                      </div>
                      <div className="mt-1.5 flex justify-between text-[11px] text-[var(--muted)] tabular-nums">
                        <span>{t("mi.sentimentHits", { h: inst.hits_1h, d: inst.hits_24h })}</span>
                        <span>
                          {inst.last_direction
                            ? `${inst.last_direction === "UP" ? t("mi.priceUp") : inst.last_direction === "DOWN" ? t("mi.priceDown") : t("mi.volatile")} · `
                            : ""}
                          {inst.score > 0 ? `+${inst.score}` : inst.score}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
