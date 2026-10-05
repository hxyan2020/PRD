"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { EnZh } from "@/components/EnZh";
import { cn } from "@/lib/utils";

const STEPS: Array<{ href: string; en: string; zh: string; detailEn: string; detailZh: string }> = [
  {
    href: "/admin/monitor-2",
    en: "Detect",
    zh: "偵測",
    detailEn: "Monitor 2.0 emits indicator warning / breach.",
    detailZh: "Monitor 2.0 發出指標警告／違規。",
  },
  {
    href: "/admin/alerts",
    en: "Ticket",
    zh: "工單",
    detailEn: "CRMP creates / syncs the ticket, attaches evidence and opens the tracker card.",
    detailZh: "CRMP 建立／同步工單、附上證據並打開追蹤卡片。",
  },
  {
    href: "/admin/escalation",
    en: "Escalate",
    zh: "升級",
    detailEn: "Route picks team + Lark channel + SLA for the domain and severity.",
    detailZh: "路徑依領域與嚴重度選定團隊＋Lark 頻道＋SLA。",
  },
  {
    href: "/admin/alerts",
    en: "AI RCA",
    zh: "AI 根因",
    detailEn: "AI drafts RCA on the same tracker ticket; human approves intervention.",
    detailZh: "同一張追蹤工單上 AI 草擬根因；人工核准干預。",
  },
  {
    href: "/admin/dashboard",
    en: "Dashboard",
    zh: "儀表板",
    detailEn: "Audit log + daily CFD / Exchange performance.",
    detailZh: "稽核日誌＋每日 CFD／交易所績效。",
  },
];

export function HomeSpineViz() {
  const [active, setActive] = useState(1);
  const step = STEPS[active];

  return (
    <div className="mt-4 rounded-xl bg-slate-50 border border-[var(--line)] p-3 text-sm">
      <div className="flex items-center justify-between gap-2">
        <div className="font-semibold">
          <EnZh en="Integration spine" zh="整合脊柱" />
        </div>
        <Link href="/admin/spine" className="text-xs font-semibold text-teal-800 inline-flex items-center gap-0.5">
          <EnZh en="Spine log" zh="脊柱日誌" />
          <ChevronRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {STEPS.map((s, i) => (
          <button
            key={s.en + i}
            type="button"
            onClick={() => setActive(i)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold transition",
              active === i
                ? "border-teal-600 bg-teal-600 text-white"
                : "border-[var(--line)] bg-white text-slate-700 hover:border-teal-300"
            )}
          >
            <span
              className={cn(
                "inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px]",
                active === i ? "bg-white/20" : "bg-teal-600 text-white"
              )}
            >
              {i + 1}
            </span>
            <EnZh en={s.en} zh={s.zh} />
          </button>
        ))}
      </div>
      <Link
        href={step.href}
        className="mt-3 group flex items-start gap-2 rounded-lg bg-white border border-[var(--line)] px-3 py-2.5 hover:border-teal-300 hover:shadow-sm transition"
      >
        <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal-600 text-[10px] font-bold text-white">
          {active + 1}
        </span>
        <span className="flex-1 text-[var(--muted)] group-hover:text-[var(--ink)]">
          <EnZh en={step.detailEn} zh={step.detailZh} />
        </span>
        <ChevronRight className="h-4 w-4 mt-0.5 shrink-0 text-slate-300 group-hover:text-teal-700" aria-hidden />
      </Link>
    </div>
  );
}
