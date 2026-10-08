"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui";
import {
  CS_TR_OPEN_ISSUE_CATALOGUE,
  ISSUE_STATUS_LABEL,
  OPEN_ISSUES,
  isCsTrOpenIssue,
  openIssuesCsTrSummary,
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

function jumpToIssue(id: string) {
  requestAnimationFrame(() => {
    const el = document.getElementById(id) || document.getElementById(`${id}-m`);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

export function OpenIssuesBoard() {
  const { locale } = useUiLocale();
  const zh = locale === "zh-Hant";
  const [area, setArea] = useState<IssueArea | "ALL">("ALL");
  const [bu, setBu] = useState<IssueBu | "ALL">("ALL");
  const [status, setStatus] = useState<IssueStatus | "ALL">("ALL");
  const [csTrOnly, setCsTrOnly] = useState(false);
  const summary = openIssuesSummary();
  const csTr = openIssuesCsTrSummary();

  const bus = useMemo(
    () => Array.from(new Set(OPEN_ISSUES.map((i) => i.bu))).sort() as IssueBu[],
    []
  );

  const rows = useMemo(() => {
    return OPEN_ISSUES.filter((i) => {
      if (csTrOnly && !isCsTrOpenIssue(i)) return false;
      if (area !== "ALL" && i.area !== area) return false;
      if (bu !== "ALL" && i.bu !== bu) return false;
      if (status !== "ALL" && i.status !== status) return false;
      return true;
    });
  }, [area, bu, status, csTrOnly]);

  return (
    <div className="space-y-4">
      <div className="panel p-3 sm:p-4">
        <div className="flex flex-wrap gap-2 items-center">
          <Badge className="bg-teal-50 text-teal-900 border-teal-200">CRMP-OI-001</Badge>
          <Badge className="bg-cyan-50 text-cyan-900 border-cyan-200">v1.5</Badge>
          <Badge className="bg-slate-100 text-slate-700 border-slate-200">
            {zh ? `${summary.total} 項開放議題` : `${summary.total} open issues`}
          </Badge>
          <Badge className="bg-teal-50 text-teal-900 border-teal-200">
            {zh ? `CS／TR × ${csTr.total}` : `CS/TR × ${csTr.total}`}
          </Badge>
          <Link className="btn text-sm" href="/admin/docs/progress">
            {zh ? "進度追蹤板 →" : "Progress tracker →"}
          </Link>
          <Link className="btn text-sm" href="/admin/docs/uat">
            UAT
          </Link>
          <Link className="btn text-sm" href="/cs">
            /cs
          </Link>
          <Link className="btn text-sm" href="/admin/cs-desk">
            {zh ? "CS／TR 台" : "CS / TR Desk"}
          </Link>
          <Link className="btn text-sm" href="/admin/cs-dashboard">
            {zh ? "儀表板" : "Dashboard"}
          </Link>
          <Link className="btn text-sm" href="/admin/cs-log">
            {zh ? "日誌" : "Log"}
          </Link>
          <Link className="btn text-sm" href="/admin/cs-data">
            {zh ? "資料" : "Data"}
          </Link>
        </div>
        <p className="text-sm text-[var(--muted)] mt-2">
          {zh
            ? "暫定清單：Monitor 2.0 仍在加指標；CRMP 處初始設計；技術細節與資源規劃仍開放。20 項不變。CS／TR 目錄索引大門、等待迴圈、儀表板、日誌與配套資料 — 不是再加編號。"
            : "Tentative checklist: Monitor 2.0 still adding indicators; CRMP in initial design; tech details and resource planning open. Still 20 issues. The CS/TR catalogue indexes the door, wait loop, dashboard, log and supporting data — not extra numbered issues."}
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
              className={`btn text-xs ${!csTrOnly && area === a ? "btn-primary" : ""}`}
              onClick={() => {
                setCsTrOnly(false);
                setArea(a);
              }}
            >
              {a === "ALL" ? (zh ? "全部領域" : "All areas") : a}
            </button>
          ))}
          <button
            type="button"
            className={`btn text-xs ${csTrOnly ? "btn-primary" : ""}`}
            onClick={() => {
              setCsTrOnly(true);
              setArea("ALL");
              setBu("ALL");
              setStatus("ALL");
            }}
          >
            {zh ? "CS／TR" : "CS/TR"}
          </button>
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

      <section className="panel p-3 sm:p-4" data-testid="oi-cs-catalogue">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
          <div>
            <h3 className="font-semibold">{zh ? "CS／TR 功能目錄" : "CS/TR feature catalogue"}</h3>
            <p className="mt-1 text-xs text-[var(--muted)]">
              {zh
                ? `主案 ${csTr.primary} · 支援 ${csTr.support} · 共 ${csTr.total}。點列跳到該議題。這份目錄對應大門、等待迴圈、儀表板、日誌與配套資料，不是再加編號。仍為 20 項。`
                : `Primary ${csTr.primary} · support ${csTr.support} · ${csTr.total} total. Click a row to jump to that issue. This is the feature catalogue for the door, wait loop, dashboard, log and supporting data — not extra numbered issues. Still 20 issues.`}
            </p>
          </div>
          <Badge className="bg-teal-50 text-teal-900 border-teal-200">v1.5</Badge>
        </div>
        <ul className="mt-3 space-y-2 sm:hidden" data-testid="oi-cs-catalogue-mobile">
          {CS_TR_OPEN_ISSUE_CATALOGUE.map((row) => (
            <li key={row.id} className="rounded-xl border border-[var(--line)] p-3 space-y-1">
              <button
                type="button"
                className="font-mono text-teal-800 underline-offset-2 hover:underline"
                onClick={() => {
                  setCsTrOnly(true);
                  setArea("ALL");
                  setBu("ALL");
                  setStatus("ALL");
                  jumpToIssue(row.id);
                }}
              >
                {row.id}
              </button>
              <Badge
                className={
                  row.kind === "primary"
                    ? "bg-teal-50 text-teal-900 border-teal-200"
                    : "bg-slate-100 text-slate-700 border-slate-200"
                }
              >
                {row.kind === "primary" ? (zh ? "主案" : "primary") : zh ? "支援" : "support"}
              </Badge>
              <div className="text-sm break-word">{zh ? row.featureZh : row.featureEn}</div>
              <div className="text-xs text-[var(--muted)] break-word">{zh ? row.shippedZh : row.shippedEn}</div>
            </li>
          ))}
        </ul>
        <div className="mt-3 overflow-x-auto hidden sm:block">
          <table className="w-full text-xs min-w-[40rem]">
            <thead>
              <tr className="text-left text-[var(--muted)] border-b border-[var(--line)]">
                <th className="py-1.5 pr-2 font-medium">{zh ? "議題" : "Issue"}</th>
                <th className="py-1.5 pr-2 font-medium">{zh ? "種類" : "Kind"}</th>
                <th className="py-1.5 pr-2 font-medium">{zh ? "功能" : "Feature"}</th>
                <th className="py-1.5 pr-2 font-medium">{zh ? "原型已交付" : "Prototype shipped"}</th>
                <th className="py-1.5 font-medium">{zh ? "正式仍開放" : "Still open"}</th>
              </tr>
            </thead>
            <tbody>
              {CS_TR_OPEN_ISSUE_CATALOGUE.map((row) => (
                <tr key={row.id} className="border-b border-[var(--line)] last:border-0">
                  <td className="py-1.5 pr-2 align-top">
                    <button
                      type="button"
                      className="font-mono text-teal-800 underline-offset-2 hover:underline"
                      onClick={() => {
                        setCsTrOnly(true);
                        setArea("ALL");
                        setBu("ALL");
                        setStatus("ALL");
                        jumpToIssue(row.id);
                      }}
                    >
                      {row.id}
                    </button>
                  </td>
                  <td className="py-1.5 pr-2 align-top">
                    <Badge
                      className={
                        row.kind === "primary"
                          ? "bg-teal-50 text-teal-900 border-teal-200"
                          : "bg-slate-100 text-slate-700 border-slate-200"
                      }
                    >
                      {row.kind === "primary" ? (zh ? "主案" : "primary") : zh ? "支援" : "support"}
                    </Badge>
                  </td>
                  <td className="py-1.5 pr-2 align-top break-word">{zh ? row.featureZh : row.featureEn}</td>
                  <td className="py-1.5 pr-2 align-top text-[var(--muted)] break-word">
                    {zh ? row.shippedZh : row.shippedEn}
                  </td>
                  <td className="py-1.5 align-top text-[var(--muted)] break-word">
                    {zh ? row.remainingZh : row.remainingEn}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <ul className="space-y-2 sm:hidden" data-testid="open-issues-mobile">
        {rows.map((i) => {
          const copy = zh ? i.zh : i.en;
          return (
            <li key={i.id} id={`${i.id}-m`} className="panel p-3 space-y-2">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <input type="checkbox" className="h-4 w-4 shrink-0" aria-label={i.id} />
                  <span className="font-mono text-xs">{i.id}</span>
                  {isCsTrOpenIssue(i) ? (
                    <span className="badge border bg-teal-50 text-teal-900 border-teal-200">CS/TR</span>
                  ) : null}
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
                  <td className="font-mono text-xs whitespace-nowrap">
                    {i.id}
                    {isCsTrOpenIssue(i) ? (
                      <span className="ml-1 badge border bg-teal-50 text-teal-900 border-teal-200">CS/TR</span>
                    ) : null}
                  </td>
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
