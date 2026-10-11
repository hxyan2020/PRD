"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui";
import {
  ISSUE_STATUS_LABEL,
  OPEN_ISSUES,
  openIssuesSummary,
  type IssueArea,
  type IssueBu,
  type IssueStatus,
  type OpenIssue,
} from "@/lib/docs/open-issues";
import { useUiLocale } from "@/hooks/useUiLocale";

const AREAS: Array<IssueArea | "ALL"> = [
  "ALL",
  "AI",
  "System",
  "RO",
  "Pricing",
  "Ops",
  "Monitor",
  "Product",
  "Platform",
  "GRC",
  "CS",
  "TR",
];

function statusTone(s: IssueStatus) {
  switch (s) {
    case "wip":
    case "started":
      return "bg-teal-50 text-teal-900 border-teal-200";
    case "delayed":
      return "bg-rose-50 text-rose-900 border-rose-200";
    case "uat":
      return "bg-amber-50 text-amber-950 border-amber-200";
    case "go_live":
      return "bg-emerald-50 text-emerald-900 border-emerald-200";
    case "bau":
      return "bg-slate-100 text-slate-700 border-slate-200";
    default:
      return "bg-white text-slate-700 border-slate-200";
  }
}

function priorityTone(p: OpenIssue["priority"]) {
  if (p === "P0") return "bg-rose-50 text-rose-900 border-rose-200";
  if (p === "P1") return "bg-orange-50 text-orange-950 border-orange-200";
  if (p === "P2") return "bg-amber-50 text-amber-950 border-amber-200";
  return "bg-slate-100 text-slate-700 border-slate-200";
}

export function OpenIssuesBoard() {
  const { locale } = useUiLocale();
  const zh = locale === "zh-Hant";
  const [area, setArea] = useState<IssueArea | "ALL">("ALL");
  const [bu, setBu] = useState<IssueBu | "ALL">("ALL");
  const [status, setStatus] = useState<IssueStatus | "ALL">("ALL");
  const summary = openIssuesSummary();

  const bus = useMemo(
    () => Array.from(new Set(OPEN_ISSUES.map((i) => i.bu))).sort() as IssueBu[],
    []
  );

  const rows = useMemo(() => {
    return OPEN_ISSUES.filter((i) => {
      if (area !== "ALL" && i.area !== area) return false;
      if (bu !== "ALL" && i.bu !== bu) return false;
      if (status !== "ALL" && i.status !== status) return false;
      return true;
    });
  }, [area, bu, status]);

  return (
    <div className="space-y-4">
      <div className="panel p-3 sm:p-4">
        <div className="flex flex-wrap gap-2 items-center">
          <Badge className="bg-teal-50 text-teal-900 border-teal-200">CRMP-OI-001</Badge>
          <Badge className="bg-slate-100 text-slate-700 border-slate-200">
            {zh ? `${summary.total} 項開放議題` : `${summary.total} open issues`}
          </Badge>
          <Link className="btn text-sm" href="/admin/docs/progress">
            {zh ? "進度追蹤板 →" : "Progress tracker →"}
          </Link>
        </div>
        <p className="text-sm text-[var(--muted)] mt-2">
          {zh
            ? "暫定清單：Monitor 2.0 仍在加指標；CRMP 處初始設計；技術細節與資源規劃仍開放。勾選式詳情、暫定 ETA、負責 BU 與依賴。"
            : "Tentative checklist: Monitor 2.0 still adding indicators; CRMP in initial design; tech details and resource planning open. Detailed rows with ETA, responsible BU, and dependencies."}
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {(Object.keys(ISSUE_STATUS_LABEL) as IssueStatus[]).map((s) => (
            <span key={s} className={`badge border ${statusTone(s)}`}>
              {ISSUE_STATUS_LABEL[s][zh ? "zh-Hant" : "en"]}: {summary.byStatus[s]}
            </span>
          ))}
        </div>
      </div>

      <div className="panel p-3 sm:p-4 space-y-3">
        <div className="chip-scroller">
          {AREAS.map((a) => (
            <button
              key={a}
              type="button"
              className={`btn text-xs ${area === a ? "btn-primary" : ""}`}
              onClick={() => setArea(a)}
            >
              {a === "ALL" ? (zh ? "全部領域" : "All areas") : a}
            </button>
          ))}
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <label className="flex-1 min-w-0">
            <span className="label">{zh ? "負責 BU" : "Responsible BU"}</span>
            <select
              className="select"
              value={bu}
              onChange={(e) => setBu(e.target.value as IssueBu | "ALL")}
            >
              <option value="ALL">{zh ? "全部 BU" : "All BUs"}</option>
              {bus.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </label>
          <label className="flex-1 min-w-0">
            <span className="label">{zh ? "狀態" : "Status"}</span>
            <select
              className="select"
              value={status}
              onChange={(e) => setStatus(e.target.value as IssueStatus | "ALL")}
            >
              <option value="ALL">{zh ? "全部狀態" : "All statuses"}</option>
              {(Object.keys(ISSUE_STATUS_LABEL) as IssueStatus[]).map((s) => (
                <option key={s} value={s}>
                  {ISSUE_STATUS_LABEL[s][zh ? "zh-Hant" : "en"]}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <ul className="space-y-2 sm:hidden" data-testid="open-issues-mobile">
        {rows.map((i) => {
          const copy = zh ? i.zh : i.en;
          return (
            <li key={i.id} id={`${i.id}-m`} className="panel p-3 space-y-2">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <input type="checkbox" className="h-4 w-4 shrink-0" aria-label={i.id} />
                  <span className="font-mono text-xs">{i.id}</span>
                  <span className={`badge border ${priorityTone(i.priority)}`}>{i.priority}</span>
                </div>
                <span className={`badge border ${statusTone(i.status)}`}>
                  {ISSUE_STATUS_LABEL[i.status][zh ? "zh-Hant" : "en"]}
                </span>
              </div>
              <div className="font-semibold text-sm break-words">{copy.title}</div>
              <p className="text-xs text-[var(--muted)] break-words">{copy.detail}</p>
              <div className="flex flex-wrap gap-1.5 text-xs">
                <span className="badge border bg-slate-100 text-slate-700 border-slate-200">{i.area}</span>
                <span className="font-semibold">{i.bu}</span>
                <span className="text-[var(--muted)] tabular-nums">{copy.eta}</span>
              </div>
              <ul className="space-y-1.5" data-testid={`oi-checklist-m-${i.id}`}>
                {i.checklist.map((c, idx) => (
                  <li key={idx} className="flex gap-2 text-xs items-start">
                    <input
                      type="checkbox"
                      className="mt-0.5 h-3.5 w-3.5 shrink-0"
                      defaultChecked={!!c.done}
                      aria-label={zh ? c.zh : c.en}
                    />
                    <span className={c.done ? "text-[var(--muted)] line-through" : ""}>
                      {zh ? c.zh : c.en}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="text-[11px] text-[var(--muted)] break-words">
                <span className="font-semibold">{zh ? "依賴：" : "Depends: "}</span>
                {copy.dependencies}
              </p>
            </li>
          );
        })}
      </ul>

      <div className="table-wrap panel hidden sm:block overflow-x-auto">
        <table className="data">
          <thead>
            <tr>
              <th>{zh ? "勾選" : "✓"}</th>
              <th>ID</th>
              <th>{zh ? "優先" : "Pri"}</th>
              <th>{zh ? "標題" : "Title"}</th>
              <th>{zh ? "領域" : "Area"}</th>
              <th>BU</th>
              <th>{zh ? "狀態" : "Status"}</th>
              <th>ETA</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((i) => {
              const copy = zh ? i.zh : i.en;
              return (
                <tr key={i.id} id={i.id} className="align-top">
                  <td>
                    <input type="checkbox" className="h-4 w-4" aria-label={i.id} />
                  </td>
                  <td className="font-mono text-xs whitespace-nowrap">{i.id}</td>
                  <td>
                    <span className={`badge border ${priorityTone(i.priority)}`}>{i.priority}</span>
                  </td>
                  <td className="min-w-[16rem] max-w-xl">
                    <div className="font-semibold text-sm">{copy.title}</div>
                    <p className="text-xs text-[var(--muted)] mt-1 break-word">{copy.detail}</p>
                    <ul className="mt-2 space-y-1" data-testid={`oi-checklist-${i.id}`}>
                      {i.checklist.map((c, idx) => (
                        <li key={idx} className="flex gap-2 text-xs items-start">
                          <input
                            type="checkbox"
                            className="mt-0.5 h-3.5 w-3.5 shrink-0"
                            defaultChecked={!!c.done}
                            aria-label={zh ? c.zh : c.en}
                          />
                          <span className={c.done ? "text-[var(--muted)] line-through" : ""}>
                            {zh ? c.zh : c.en}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <p className="text-[11px] text-[var(--muted)] mt-2">
                      <span className="font-semibold">{zh ? "依賴：" : "Depends: "}</span>
                      {copy.dependencies}
                    </p>
                  </td>
                  <td className="whitespace-nowrap text-xs">{i.area}</td>
                  <td className="whitespace-nowrap text-xs font-semibold">{i.bu}</td>
                  <td>
                    <span className={`badge border ${statusTone(i.status)}`}>
                      {ISSUE_STATUS_LABEL[i.status][zh ? "zh-Hant" : "en"]}
                    </span>
                  </td>
                  <td className="text-xs whitespace-nowrap">{copy.eta}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {!rows.length ? (
        <p className="text-sm text-[var(--muted)]">{zh ? "無符合篩選的議題。" : "No issues match filters."}</p>
      ) : null}
    </div>
  );
}
