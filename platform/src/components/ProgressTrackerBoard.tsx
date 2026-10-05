"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui";
import {
  ISSUE_STATUS_LABEL,
  OPEN_ISSUES,
  PROGRESS_TIMELINE,
  type IssueStatus,
  type OpenIssue,
} from "@/lib/docs/open-issues";
import { useUiLocale } from "@/hooks/useUiLocale";

const STATUS_COLOR: Record<IssueStatus, string> = {
  planned: "#94a3b8",
  started: "#0d9488",
  wip: "#0b6e6a",
  delayed: "#e11d48",
  uat: "#d97706",
  go_live: "#059669",
  bau: "#475569",
};

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

export function ProgressTrackerBoard() {
  const { locale } = useUiLocale();
  const zh = locale === "zh-Hant";
  const [focus, setFocus] = useState<string | null>(OPEN_ISSUES[0]?.id ?? null);
  const [statusFilter, setStatusFilter] = useState<IssueStatus | "ALL">("ALL");

  const rows = useMemo(() => {
    return OPEN_ISSUES.filter((i) => statusFilter === "ALL" || i.status === statusFilter);
  }, [statusFilter]);

  const rowH = 28;
  const labelW = 220;
  const chartW = 720;
  const padTop = 36;
  const padBot = 24;
  const chartH = padTop + rows.length * rowH + padBot;
  const monthW = chartW / PROGRESS_TIMELINE.monthCount;
  const nowIdx = 0; // 2026-10

  function bar(i: OpenIssue) {
    const x = labelW + i.startMonth * monthW;
    const w = Math.max(monthW * 0.6, (i.endMonth - i.startMonth + 1) * monthW - 4);
    return { x, w };
  }

  const focused = OPEN_ISSUES.find((i) => i.id === focus) ?? null;
  const focusedCopy = focused ? (zh ? focused.zh : focused.en) : null;

  return (
    <div className="space-y-4">
      <div className="panel p-3 sm:p-4">
        <div className="flex flex-wrap gap-2 items-center">
          <Badge className="bg-teal-50 text-teal-900 border-teal-200">CRMP-PT-001</Badge>
          <Badge className="bg-slate-100 text-slate-700 border-slate-200">
            {zh
              ? `X＝議題 · Y＝${PROGRESS_TIMELINE.startLabel}→${PROGRESS_TIMELINE.endLabel}`
              : `X = issues · Y = ${PROGRESS_TIMELINE.startLabel} → ${PROGRESS_TIMELINE.endLabel}`}
          </Badge>
          <Link className="btn text-sm" href="/admin/docs/open-issues">
            {zh ? "開放議題清單 →" : "Open issues list →"}
          </Link>
        </div>
        <p className="text-sm text-[var(--muted)] mt-2">
          {zh
            ? "每個開放議題一列：狀態（已規劃／已啟動／進行中／延期／UAT／上線／日常）、負責 BU、時間軸至 2027 年底。點列檢視詳情。"
            : "One row per open issue: status (planned / started / WIP / delayed / UAT / go live / BAU), responsible BU, timeline through end-2027. Click a row for detail."}
        </p>
        <div className="chip-scroller mt-3">
          <button
            type="button"
            className={`btn text-xs ${statusFilter === "ALL" ? "btn-primary" : ""}`}
            onClick={() => setStatusFilter("ALL")}
          >
            {zh ? "全部狀態" : "All statuses"}
          </button>
          {(Object.keys(ISSUE_STATUS_LABEL) as IssueStatus[]).map((s) => (
            <button
              key={s}
              type="button"
              className={`btn text-xs ${statusFilter === s ? "btn-primary" : ""}`}
              onClick={() => setStatusFilter(s)}
            >
              {ISSUE_STATUS_LABEL[s][zh ? "zh-Hant" : "en"]}
            </button>
          ))}
        </div>
      </div>

      <div className="panel p-2 sm:p-4 overflow-x-auto">
        <svg
          viewBox={`0 0 ${labelW + chartW + 8} ${chartH}`}
          className="w-full min-w-[640px] h-auto"
          role="img"
          aria-label={zh ? "進度甘特圖" : "Progress Gantt chart"}
        >
          <rect x={0} y={0} width={labelW + chartW + 8} height={chartH} fill="#fff" />
          {PROGRESS_TIMELINE.months.map((m, idx) => {
            const x = labelW + idx * monthW;
            return (
              <g key={m}>
                <line
                  x1={x}
                  y1={padTop - 8}
                  x2={x}
                  y2={chartH - padBot + 4}
                  stroke="#e2e8f0"
                  strokeWidth={1}
                />
                <text
                  x={x + monthW / 2}
                  y={18}
                  textAnchor="middle"
                  fontSize={9}
                  fill="#64748b"
                  fontFamily="ui-monospace, monospace"
                >
                  {m.slice(2)}
                </text>
              </g>
            );
          })}
          {/* now marker */}
          <line
            x1={labelW + nowIdx * monthW + 2}
            y1={padTop - 12}
            x2={labelW + nowIdx * monthW + 2}
            y2={chartH - padBot + 4}
            stroke="#0b6e6a"
            strokeWidth={2}
            strokeDasharray="4 3"
          />
          <text
            x={labelW + nowIdx * monthW + 6}
            y={padTop - 14}
            fontSize={10}
            fill="#0b6e6a"
            fontWeight={600}
          >
            {zh ? "現在" : "now"}
          </text>

          {rows.map((i, row) => {
            const y = padTop + row * rowH;
            const copy = zh ? i.zh : i.en;
            const { x, w } = bar(i);
            const active = focus === i.id;
            return (
              <g
                key={i.id}
                role="button"
                tabIndex={0}
                style={{ cursor: "pointer" }}
                onClick={() => setFocus(i.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") setFocus(i.id);
                }}
              >
                <rect
                  x={0}
                  y={y - 2}
                  width={labelW + chartW + 8}
                  height={rowH}
                  fill={active ? "#f0fdfa" : row % 2 ? "#f8fafc" : "#fff"}
                />
                <text x={8} y={y + 14} fontSize={11} fill="#0f1b2d" fontFamily="ui-sans-serif, system-ui">
                  {i.id} · {i.bu}
                </text>
                <text x={8} y={y + 24} fontSize={9} fill="#64748b">
                  {copy.title.length > 32 ? `${copy.title.slice(0, 30)}…` : copy.title}
                </text>
                <rect
                  x={x}
                  y={y + 4}
                  width={w}
                  height={16}
                  rx={4}
                  fill={STATUS_COLOR[i.status]}
                  opacity={0.9}
                />
                <text
                  x={x + 6}
                  y={y + 15}
                  fontSize={9}
                  fill="#fff"
                  fontWeight={600}
                >
                  {ISSUE_STATUS_LABEL[i.status][zh ? "zh-Hant" : "en"]}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {focused && focusedCopy ? (
        <div className="panel p-3 sm:p-4" data-testid="progress-detail">
          <div className="flex flex-wrap gap-2 items-center">
            <span className="font-mono text-sm font-semibold">{focused.id}</span>
            <span className={`badge border ${statusTone(focused.status)}`}>
              {ISSUE_STATUS_LABEL[focused.status][zh ? "zh-Hant" : "en"]}
            </span>
            <Badge className="bg-slate-100 text-slate-700 border-slate-200">{focused.priority}</Badge>
            <Badge className="bg-teal-50 text-teal-900 border-teal-200">
              {zh ? `負責 BU：${focused.bu}` : `BU: ${focused.bu}`}
            </Badge>
            <Badge className="bg-white text-slate-700 border-slate-200">{focused.area}</Badge>
          </div>
          <h3 className="font-semibold mt-2">{focusedCopy.title}</h3>
          <p className="text-sm text-[var(--muted)] mt-1 break-word">{focusedCopy.detail}</p>
          <dl className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            <div>
              <dt className="text-xs uppercase tracking-wide text-[var(--muted)]">{zh ? "暫定 ETA" : "Tentative ETA"}</dt>
              <dd className="font-semibold">{focusedCopy.eta}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-[var(--muted)]">{zh ? "依賴" : "Dependencies"}</dt>
              <dd>{focusedCopy.dependencies}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-[var(--muted)]">{zh ? "時間軸" : "Timeline"}</dt>
              <dd className="font-mono text-xs">
                {PROGRESS_TIMELINE.months[focused.startMonth]} → {PROGRESS_TIMELINE.months[focused.endMonth]}
              </dd>
            </div>
          </dl>
        </div>
      ) : null}

      <div className="table-wrap panel sm:hidden">
        <table className="data">
          <thead>
            <tr>
              <th>ID</th>
              <th>BU</th>
              <th>{zh ? "狀態" : "Status"}</th>
              <th>ETA</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((i) => (
              <tr key={i.id} onClick={() => setFocus(i.id)} className="cursor-pointer">
                <td className="font-mono text-xs">{i.id}</td>
                <td className="text-xs">{i.bu}</td>
                <td>
                  <span className={`badge border ${statusTone(i.status)}`}>
                    {ISSUE_STATUS_LABEL[i.status][zh ? "zh-Hant" : "en"]}
                  </span>
                </td>
                <td className="text-xs">{zh ? i.zh.eta : i.en.eta}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
