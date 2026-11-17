"use client";

import Link from "next/link";
import { PageHeader, Badge } from "@/components/ui";
import { VantageMark } from "@/components/VantageLogo";
import { OwnerBadge } from "@/components/OwnerBadge";
import { useUiLocale } from "@/hooks/useUiLocale";
import { RoadmapBoard } from "@/components/RoadmapBoard";
import { roadmapSummary } from "@/lib/docs/roadmap-items";

export function RoadmapView() {
  const { locale, setLocale } = useUiLocale();
  const zh = locale === "zh-Hant";
  const summary = roadmapSummary();

  return (
    <div>
      <PageHeader
        title={zh ? "平台改進路線圖" : "Platform Improvement Roadmap"}
        subtitle={
          zh
            ? `每一項含現行原型、檔案／API、要做什麼、工期、人力與完成標準。共 ${summary.count} 項 · Critical ${summary.bySev.Critical} · High ${summary.bySev.High}。`
            : `Each item: current prototype, files/APIs, what to build, effort, owners, and done-when. ${summary.count} items · Critical ${summary.bySev.Critical} · High ${summary.bySev.High}.`
        }
        actions={
          <>
            <Link className="btn" href="/admin/docs/uat">
              {zh ? "UAT 清單" : "UAT Checklist"}
            </Link>
            <Link className="btn" href="/admin/docs/ecosystem">
              {zh ? "生態評估" : "Ecosystem Eval"}
            </Link>
          </>
        }
      />

      <div className="panel p-3 sm:p-4 mb-4 flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-3">
        <div className="flex flex-wrap gap-2 items-center">
          <VantageMark className="h-8 w-8" />
          <Badge className="bg-teal-50 text-teal-900 border-teal-200">CRMP-RM-001</Badge>
          <Badge className="bg-slate-100 text-slate-700 border-slate-200">v1.6</Badge>
          <OwnerBadge />
          <Link className="btn" href="/admin/docs/urls">
            {zh ? "全部網址" : "All URLs"}
          </Link>
        </div>
        <div className="action-row">
          <button
            type="button"
            className={`btn ${locale === "en" ? "btn-primary" : ""}`}
            onClick={() => setLocale("en")}
          >
            English
          </button>
          <button
            type="button"
            className={`btn ${locale === "zh-Hant" ? "btn-primary" : ""}`}
            onClick={() => setLocale("zh-Hant")}
          >
            繁體中文
          </button>
        </div>
      </div>

      <RoadmapBoard />
    </div>
  );
}
