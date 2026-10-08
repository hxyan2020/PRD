"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui";
import {
  riskScenarioRowsForEdition,
  riskScenarioSummary,
  type CorrelationPattern,
  type DocPriority,
  type RiskScenarioBucket,
  type RiskScenarioEdition,
  type RiskScenarioKind,
} from "@/lib/docs/risk-scenario-rows";
import { correlationPatternLabel } from "@/lib/docs/risk-scenario-correlations";
import { useUiLocale } from "@/hooks/useUiLocale";

const BUCKETS: Array<RiskScenarioBucket | "ALL"> = [
  "ALL",
  "admin_system",
  "pricing",
  "risk_ops",
  "cs_tr",
];

const KINDS: Array<RiskScenarioKind | "ALL"> = ["ALL", "skill", "chain", "correlation", "doc_extra"];
const SEVS: Array<DocPriority | "ALL"> = ["ALL", "P0", "P1", "P2", "P3"];
const PATTERNS: Array<CorrelationPattern | "ALL"> = [
  "ALL",
  "one_account_many_alerts",
  "one_alert_many_users",
  "cross_team",
  "cross_book",
  "multi_indicator_sequence",
  "kyc_cluster",
  "vendor_cascade",
];

function bucketLabel(b: RiskScenarioBucket, zh: boolean) {
  if (b === "admin_system") return zh ? "後台／系統" : "Admin system";
  if (b === "pricing") return zh ? "報價／商品" : "Pricing";
  if (b === "risk_ops") return zh ? "風險營運" : "Risk ops";
  return zh ? "客服／交易台" : "CS / TR";
}

function kindLabel(k: RiskScenarioKind, zh: boolean) {
  if (k === "skill") return zh ? "技能" : "Skill";
  if (k === "chain") return zh ? "連結鏈" : "Chain";
  if (k === "correlation") return zh ? "相關／共鳴" : "Correlation";
  return zh ? "擴充" : "Doc extra";
}

function sevTone(p: DocPriority) {
  if (p === "P0") return "bg-rose-50 text-rose-900 border-rose-200";
  if (p === "P1") return "bg-orange-50 text-orange-950 border-orange-200";
  if (p === "P2") return "bg-amber-50 text-amber-950 border-amber-200";
  return "bg-slate-100 text-slate-700 border-slate-200";
}

export function RiskScenariosBoard({ initialEdition = "plus" }: { initialEdition?: RiskScenarioEdition }) {
  const { locale } = useUiLocale();
  const zh = locale === "zh-Hant";
  const [edition, setEdition] = useState<RiskScenarioEdition>(initialEdition);
  const [bucket, setBucket] = useState<RiskScenarioBucket | "ALL">("ALL");
  const [kind, setKind] = useState<RiskScenarioKind | "ALL">("ALL");
  const [sev, setSev] = useState<DocPriority | "ALL">("ALL");
  const [pattern, setPattern] = useState<CorrelationPattern | "ALL">("ALL");
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const summary = useMemo(() => riskScenarioSummary(edition), [edition]);
  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return riskScenarioRowsForEdition(edition).filter((r) => {
      if (bucket !== "ALL" && r.bucket !== bucket) return false;
      if (kind !== "ALL" && r.kind !== kind) return false;
      if (sev !== "ALL" && r.severity !== sev) return false;
      if (pattern !== "ALL" && r.correlation_pattern !== pattern) return false;
      if (!needle) return true;
      const hay = [
        r.id,
        r.name_en,
        r.name_zh,
        r.description_en,
        r.description_zh,
        r.domain,
        r.indicators.join(" "),
        r.escalation_en,
        r.correlation_pattern || "",
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(needle);
    });
  }, [edition, bucket, kind, sev, pattern, q]);

  return (
    <div className="space-y-4">
      <div className="panel p-3 sm:p-4 space-y-3">
        <div className="flex flex-wrap gap-2 items-center">
          <Badge className="bg-teal-50 text-teal-900 border-teal-200">CRMP-RS-001</Badge>
          <Badge className="bg-cyan-50 text-cyan-900 border-cyan-200">v1.1</Badge>
          <Badge className="bg-slate-100 text-slate-700 border-slate-200">
            {zh ? `${summary.total} 列` : `${summary.total} rows`}
          </Badge>
          <Badge className="bg-rose-50 text-rose-900 border-rose-200">P0 × {summary.bySev.P0}</Badge>
          <Badge className="bg-orange-50 text-orange-950 border-orange-200">P1 × {summary.bySev.P1}</Badge>
          <Badge className="bg-amber-50 text-amber-950 border-amber-200">
            {zh ? `技能 ${summary.byKind.skill}` : `Skills ${summary.byKind.skill}`}
          </Badge>
          <Badge className="bg-slate-50 text-slate-800 border-slate-200">
            {zh ? `連結鏈 ${summary.byKind.chain}` : `Chains ${summary.byKind.chain}`}
          </Badge>
          <Badge className="bg-violet-50 text-violet-900 border-violet-200">
            {zh ? `相關 ${summary.byKind.correlation}` : `Corr ${summary.byKind.correlation}`}
          </Badge>
          <Badge className="bg-slate-50 text-slate-800 border-slate-200">
            {zh ? `擴充 ${summary.byKind.doc_extra}` : `Extras ${summary.byKind.doc_extra}`}
          </Badge>
        </div>

        <p className="text-sm text-[var(--muted)] max-w-4xl">
          {zh
            ? "彙整 AI Skills、多指標連結鏈，以及明確的指標相關型態（一帳戶多警報、一警報多使用者、跨團隊、跨帳簿、KYC 叢集、供應商連鎖）。CRMP Plus 含 CS／TR；Classic 對齊凍結原版 Admin。"
            : "Summarises AI Skills, multi-indicator chains, and explicit correlation shapes (one account→many alerts, one alert→many users, cross-team, cross-book, KYC cluster, vendor cascade). CRMP Plus includes CS/TR; Classic matches frozen original Admin."}
        </p>

        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs font-medium text-[var(--muted)]">{zh ? "版本" : "Edition"}</span>
          <button
            type="button"
            className={`btn text-xs !min-h-8 ${edition === "plus" ? "btn-primary" : ""}`}
            onClick={() => setEdition("plus")}
          >
            CRMP Plus
          </button>
          <button
            type="button"
            className={`btn text-xs !min-h-8 ${edition === "classic" ? "btn-primary" : ""}`}
            onClick={() => setEdition("classic")}
          >
            {zh ? "原版 CRMP Admin" : "Classic CRMP Admin"}
          </button>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <input
            className="input text-sm min-w-[12rem] flex-1"
            placeholder={zh ? "搜尋代碼、指標、名稱…" : "Search code, indicator, name…"}
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <select
            className="input text-sm !w-auto"
            value={bucket}
            onChange={(e) => setBucket(e.target.value as RiskScenarioBucket | "ALL")}
          >
            {BUCKETS.map((b) => (
              <option key={b} value={b}>
                {b === "ALL" ? (zh ? "全部領域" : "All domains") : bucketLabel(b, zh)}
              </option>
            ))}
          </select>
          <select
            className="input text-sm !w-auto"
            value={kind}
            onChange={(e) => setKind(e.target.value as RiskScenarioKind | "ALL")}
          >
            {KINDS.map((k) => (
              <option key={k} value={k}>
                {k === "ALL" ? (zh ? "全部類型" : "All kinds") : kindLabel(k, zh)}
              </option>
            ))}
          </select>
          <select
            className="input text-sm !w-auto"
            value={sev}
            onChange={(e) => setSev(e.target.value as DocPriority | "ALL")}
          >
            {SEVS.map((s) => (
              <option key={s} value={s}>
                {s === "ALL" ? (zh ? "全部嚴重度" : "All severity") : s}
              </option>
            ))}
          </select>
          <select
            className="input text-sm !w-auto"
            value={pattern}
            onChange={(e) => setPattern(e.target.value as CorrelationPattern | "ALL")}
          >
            {PATTERNS.map((p) => (
              <option key={p} value={p}>
                {p === "ALL"
                  ? zh
                    ? "全部相關型態"
                    : "All correlation patterns"
                  : correlationPatternLabel(p, zh)}
              </option>
            ))}
          </select>
          <Badge className="bg-white text-slate-700 border-slate-200">
            {zh ? `顯示 ${rows.length}` : `Showing ${rows.length}`}
          </Badge>
        </div>
      </div>

      <div className="panel overflow-x-auto">
        <table className="min-w-[1100px] w-full text-left text-xs sm:text-sm">
          <thead className="bg-slate-50 border-b border-[var(--line)] sticky top-0 z-10">
            <tr className="text-[var(--muted)]">
              <th className="p-2 font-medium whitespace-nowrap">{zh ? "情境名稱" : "Risk scenario"}</th>
              <th className="p-2 font-medium">{zh ? "描述（發生什麼）" : "Description"}</th>
              <th className="p-2 font-medium whitespace-nowrap">{zh ? "指標" : "Indicators"}</th>
              <th className="p-2 font-medium">{zh ? "維度" : "Dimensions"}</th>
              <th className="p-2 font-medium whitespace-nowrap">{zh ? "預警" : "Warn"}</th>
              <th className="p-2 font-medium whitespace-nowrap">{zh ? "違規" : "Breach"}</th>
              <th className="p-2 font-medium whitespace-nowrap">{zh ? "頻率" : "Frequency"}</th>
              <th className="p-2 font-medium whitespace-nowrap">{zh ? "嚴重度／升級" : "Severity / escalation"}</th>
              <th className="p-2 font-medium">{zh ? "調查順序" : "Investigation"}</th>
              <th className="p-2 font-medium">{zh ? "建議處置" : "Solution"}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const open = openId === r.id;
              const name = zh ? r.name_zh : r.name_en;
              const desc = zh ? r.description_zh : r.description_en;
              const dims = zh ? r.dimensions_zh : r.dimensions;
              const freq = zh ? r.frequency_zh : r.frequency_en;
              const esc = zh ? r.escalation_zh : r.escalation_en;
              const inv = zh ? r.investigation_zh : r.investigation_en;
              const sol = zh ? r.solution_zh : r.solution_en;
              return (
                <tr key={r.id} className="border-b border-[var(--line)] align-top hover:bg-orange-50/30">
                  <td className="p-2 min-w-[12rem]">
                    <div className="font-medium text-[var(--ink)]">{name}</div>
                    <div className="text-[11px] text-[var(--muted)] mt-0.5">{r.id}</div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      <Badge className="!text-[10px] bg-slate-50">{kindLabel(r.kind, zh)}</Badge>
                      <Badge className="!text-[10px] bg-slate-50">{bucketLabel(r.bucket, zh)}</Badge>
                      {r.correlation_pattern ? (
                        <Badge className="!text-[10px] bg-violet-50 text-violet-900 border-violet-200">
                          {correlationPatternLabel(r.correlation_pattern, zh)}
                        </Badge>
                      ) : null}
                      {r.skill_href ? (
                        <Link className="btn !text-[10px] !min-h-6 !px-1.5" href={r.skill_href}>
                          {zh ? "技能" : "Skill"}
                        </Link>
                      ) : null}
                    </div>
                  </td>
                  <td className="p-2 max-w-[16rem]">
                    <p className={open ? "" : "line-clamp-3"}>{desc}</p>
                    <button
                      type="button"
                      className="text-[11px] text-teal-800 underline mt-1"
                      onClick={() => setOpenId(open ? null : r.id)}
                    >
                      {open ? (zh ? "收合" : "Less") : zh ? "展開" : "More"}
                    </button>
                  </td>
                  <td className="p-2 whitespace-nowrap">
                    <div className="flex flex-col gap-0.5">
                      {r.indicators.slice(0, open ? 12 : 4).map((id) => (
                        <Link
                          key={id}
                          href={`/admin/monitor-2?highlight=${encodeURIComponent(id)}`}
                          className="text-teal-800 underline"
                        >
                          {id}
                        </Link>
                      ))}
                    </div>
                  </td>
                  <td className="p-2 max-w-[10rem]">{dims}</td>
                  <td className="p-2 whitespace-nowrap font-mono text-[11px]">{r.warn}</td>
                  <td className="p-2 whitespace-nowrap font-mono text-[11px]">{r.breach}</td>
                  <td className="p-2 whitespace-nowrap">{freq}</td>
                  <td className="p-2 max-w-[14rem]">
                    <Badge className={`mb-1 ${sevTone(r.severity)}`}>{r.severity}</Badge>
                    <p className={open ? "text-[11px]" : "text-[11px] line-clamp-3"}>{esc}</p>
                  </td>
                  <td className="p-2 max-w-[14rem]">
                    <ol className="list-decimal pl-4 space-y-0.5 text-[11px]">
                      {(open ? inv : inv.slice(0, 3)).map((step, i) => (
                        <li key={`${r.id}-inv-${i}`}>{step}</li>
                      ))}
                    </ol>
                  </td>
                  <td className="p-2 max-w-[14rem]">
                    <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                      {(open ? sol : sol.slice(0, 3)).map((step, i) => (
                        <li key={`${r.id}-sol-${i}`}>{step}</li>
                      ))}
                    </ul>
                  </td>
                </tr>
              );
            })}
            {!rows.length ? (
              <tr>
                <td colSpan={10} className="p-6 text-center text-[var(--muted)]">
                  {zh ? "無符合篩選的列。" : "No rows match these filters."}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
