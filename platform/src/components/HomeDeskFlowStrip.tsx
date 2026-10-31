"use client";

import Link from "next/link";
import {
  Activity,
  Bell,
  Compass,
  FlaskConical,
  Link2,
  MessageSquare,
  ScrollText,
  Sparkles,
} from "lucide-react";
import { EnZh } from "@/components/EnZh";
import { ForexDeskPackLinks } from "@/components/ForexDeskPackLinks";
import { FOREX_INCIDENT_1028 } from "@/lib/demo/forex-incident-1028";

const fx = FOREX_INCIDENT_1028;

const STEPS = [
  {
    href: `/admin/monitor-2?monitor_id=${fx.primary_monitor_id}`,
    icon: Activity,
    en: "Monitor 2.0",
    zh: "Monitor 2.0",
    hintEn: `${fx.primary_monitor_id} · ${fx.symbol}`,
    hintZh: `${fx.primary_monitor_id} · ${fx.symbol}`,
  },
  {
    href: `/admin/alerts?monitor_id=${fx.primary_monitor_id}`,
    icon: Bell,
    en: "Open Alerts",
    zh: "未結警報",
    hintEn: `Queue · ${fx.incident_id}`,
    hintZh: `佇列 · ${fx.incident_id}`,
  },
  {
    href: fx.discovery_path,
    icon: Compass,
    en: "Discovery",
    zh: "未知風險",
    hintEn: "Candidate intake",
    hintZh: "候選收件",
  },
  {
    href: "/admin/indicator-aggregation",
    icon: Link2,
    en: "Aggregation",
    zh: "指標聚合",
    hintEn: "L1 → L2 board",
    hintZh: "L1 → L2 看板",
  },
  {
    href: "/admin/messenger",
    icon: MessageSquare,
    en: "Messenger",
    zh: "Messenger",
    hintEn: "Ops inbox demo",
    hintZh: "值班收件示範",
  },
  {
    href: "/admin/skills",
    icon: Sparkles,
    en: "Skills",
    zh: "技能",
    hintEn: "Playbooks",
    hintZh: "劇本",
  },
  {
    href: "/admin/risk-log",
    icon: ScrollText,
    en: "Closed Risk Log",
    zh: "已結風險日誌",
    hintEn: "Closed analytics",
    hintZh: "結案分析",
  },
  {
    href: "/admin/monitor-labs",
    icon: FlaskConical,
    en: "Monitor labs",
    zh: "監控實驗室",
    hintEn: "HTML walkthroughs",
    hintZh: "HTML 演練",
  },
] as const;

/**
 * Compact desk-flow shortcuts on Admin Home.
 * Replaces the duplicated full L1→L2 and threshold demos (those live on their canonical pages).
 */
export function HomeDeskFlowStrip() {
  return (
    <section className="panel p-3 sm:p-4 mt-6">
      <div className="flex flex-wrap items-end justify-between gap-2 mb-3">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-lg">
            <EnZh en="Desk flow" zh="台面流程" />
          </h2>
          <p className="text-xs text-[var(--muted)] mt-0.5">
            <EnZh
              en="One path — detect → open queue → understand → act → close. Labs are demos only."
              zh="一條路徑 — 偵測 → 未結佇列 → 理解 → 行動 → 結案。實驗室僅供示範。"
            />
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link className="btn btn-sm" href="/admin/docs/indicators-scenarios">
            <EnZh en="Indicators & scenarios" zh="指標與情境" />
          </Link>
          <Link className="btn btn-sm" href="/admin/docs/simulated-data">
            <EnZh en="Simulated data / SQL" zh="模擬資料／SQL" />
          </Link>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-2">
        {STEPS.map((s) => {
          const Icon = s.icon;
          return (
            <Link
              key={s.href}
              href={s.href}
              className="rounded-lg border border-[var(--border)] bg-white px-2.5 py-2.5 hover:border-teal-300 hover:bg-teal-50/50 transition min-w-0"
            >
              <Icon className="h-4 w-4 text-teal-700" aria-hidden />
              <div className="mt-1.5 text-xs font-semibold leading-snug">
                <EnZh en={s.en} zh={s.zh} />
              </div>
              <div className="text-[10px] text-[var(--muted)] mt-0.5 leading-snug">
                <EnZh en={s.hintEn} zh={s.hintZh} />
              </div>
            </Link>
          );
        })}
      </div>
      <div className="mt-3">
        <ForexDeskPackLinks mode="banner" />
      </div>
    </section>
  );
}
