"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui";
import {
  CS_TR_OPEN_ISSUE_CATALOGUE,
  CS_TR_PROGRESS_FUNCTIONS,
  ISSUE_STATUS_LABEL,
  OPEN_ISSUES,
  PROGRESS_TIMELINE,
  isCsTrOpenIssue,
  openIssuesCsTrSummary,
  type IssueBu,
  type IssueStatus,
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

const BU_TONE: Record<IssueBu, string> = {
  AI: "bg-violet-50 text-violet-900 border-violet-200",
  System: "bg-sky-50 text-sky-900 border-sky-200",
  "Risk Owner": "bg-amber-50 text-amber-950 border-amber-200",
  Pricing: "bg-orange-50 text-orange-950 border-orange-200",
  Ops: "bg-emerald-50 text-emerald-900 border-emerald-200",
  Monitor: "bg-teal-50 text-teal-900 border-teal-200",
  Product: "bg-indigo-50 text-indigo-900 border-indigo-200",
  GRC: "bg-rose-50 text-rose-900 border-rose-200",
  CS: "bg-amber-50 text-amber-950 border-amber-200",
  TR: "bg-cyan-50 text-cyan-900 border-cyan-200",
  All: "bg-slate-100 text-slate-700 border-slate-200",
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
  const [buFilter, setBuFilter] = useState<IssueBu | "ALL">("ALL");
  const [csTrOnly, setCsTrOnly] = useState(false);
  const csTr = openIssuesCsTrSummary();

  const bus = useMemo(
    () => Array.from(new Set(OPEN_ISSUES.map((i) => i.bu))).sort() as IssueBu[],
    []
  );

  const cols = useMemo(() => {
    return OPEN_ISSUES.filter((i) => {
      if (csTrOnly && !isCsTrOpenIssue(i)) return false;
      if (statusFilter !== "ALL" && i.status !== statusFilter) return false;
      if (buFilter !== "ALL" && i.bu !== buFilter) return false;
      return true;
    });
  }, [statusFilter, buFilter, csTrOnly]);

  /** X = open issues (columns), Y = timeline months (rows) — now → end-2027 */
  const labelW = 72;
  const colW = 56;
  const rowH = 22;
  const headH = 64;
  const padBot = 12;
  const chartW = labelW + cols.length * colW + 8;
  const chartH = headH + PROGRESS_TIMELINE.monthCount * rowH + padBot;
  const nowIdx = 0; // 2026-10

  const focused = OPEN_ISSUES.find((i) => i.id === focus) ?? null;
  const focusedCopy = focused ? (zh ? focused.zh : focused.en) : null;

  function focusColumn(id: string) {
    setCsTrOnly(true);
    setStatusFilter("ALL");
    setBuFilter("ALL");
    setFocus(id);
  }

  return (
    <div className="space-y-4">
      <div className="panel p-3 sm:p-4">
        <div className="flex flex-wrap gap-2 items-center">
          <Badge className="bg-teal-50 text-teal-900 border-teal-200">CRMP-PT-001</Badge>
          <Badge className="bg-cyan-50 text-cyan-900 border-cyan-200">v1.6</Badge>
          <Badge className="bg-slate-100 text-slate-700 border-slate-200">
            {zh
              ? `X＝開放議題 · Y＝${PROGRESS_TIMELINE.startLabel}→${PROGRESS_TIMELINE.endLabel}`
              : `X = open issues · Y = ${PROGRESS_TIMELINE.startLabel} → ${PROGRESS_TIMELINE.endLabel}`}
          </Badge>
          <Badge className="bg-white text-slate-700 border-slate-200">
            {zh ? `${cols.length} / ${OPEN_ISSUES.length} 議題` : `${cols.length} / ${OPEN_ISSUES.length} issues`}
          </Badge>
          <Badge className="bg-teal-50 text-teal-900 border-teal-200">
            {zh ? `CS／TR × ${csTr.total}` : `CS/TR × ${csTr.total}`}
          </Badge>
          <Link className="btn text-sm" href="/admin/docs/open-issues">
            {zh ? "開放議題清單 →" : "Open issues list →"}
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
            ? "每個開放議題一欄（X），時間軸由上而下（Y：現在→2027 年底）。色塊＝狀態；欄頂清楚標示負責 BU。CS／TR 目錄索引大門、等待迴圈、技能、儀表板、日誌、資料、關卡、cs.* 與分類／嚴重度／POC — 不是額外長條。仍為 20 欄。點欄檢視詳情。"
            : "One column per open issue (X); timeline top→bottom (Y: now → end-2027). Cell colour = status; column header labels responsible BU. The CS/TR catalogue indexes the door, wait loop, skills, dashboard, log, data, hops, cs.* and categorize/severity/POC — not extra bars. Still 20 columns. Click a column for detail."}
        </p>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {(Object.keys(ISSUE_STATUS_LABEL) as IssueStatus[]).map((s) => (
            <span key={s} className="inline-flex items-center gap-1.5 text-xs">
              <span
                className="inline-block h-2.5 w-2.5 rounded-sm"
                style={{ background: STATUS_COLOR[s] }}
                aria-hidden
              />
              {ISSUE_STATUS_LABEL[s][zh ? "zh-Hant" : "en"]}
            </span>
          ))}
        </div>

        <div className="chip-scroller mt-3">
          <button
            type="button"
            className={`btn text-xs ${statusFilter === "ALL" && !csTrOnly ? "btn-primary" : ""}`}
            onClick={() => {
              setCsTrOnly(false);
              setStatusFilter("ALL");
            }}
          >
            {zh ? "全部狀態" : "All statuses"}
          </button>
          {(Object.keys(ISSUE_STATUS_LABEL) as IssueStatus[]).map((s) => (
            <button
              key={s}
              type="button"
              className={`btn text-xs ${!csTrOnly && statusFilter === s ? "btn-primary" : ""}`}
              onClick={() => {
                setCsTrOnly(false);
                setStatusFilter(s);
              }}
            >
              {ISSUE_STATUS_LABEL[s][zh ? "zh-Hant" : "en"]}
            </button>
          ))}
          <button
            type="button"
            className={`btn text-xs ${csTrOnly ? "btn-primary" : ""}`}
            onClick={() => {
              setCsTrOnly(true);
              setStatusFilter("ALL");
              setBuFilter("ALL");
            }}
          >
            {zh ? "CS／TR" : "CS/TR"}
          </button>
        </div>

        <div className="chip-scroller mt-2">
          <button
            type="button"
            className={`btn text-xs ${buFilter === "ALL" ? "btn-primary" : ""}`}
            onClick={() => setBuFilter("ALL")}
          >
            {zh ? "全部 BU" : "All BUs"}
          </button>
          {bus.map((b) => (
            <button
              key={b}
              type="button"
              className={`btn text-xs ${buFilter === b ? "btn-primary" : ""}`}
              onClick={() => setBuFilter(b)}
            >
              {b}
            </button>
          ))}
        </div>
      </div>

      <section className="panel p-3 sm:p-4" data-testid="pt-cs-catalogue">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
          <div>
            <h3 className="font-semibold">{zh ? "CS／TR 功能目錄" : "CS/TR feature catalogue"}</h3>
            <p className="mt-1 text-xs text-[var(--muted)]">
              {zh
                ? `主案 ${csTr.primary} · 支援 ${csTr.support} · 共 ${csTr.total}。點列聚焦該欄。這份目錄把大門、等待迴圈、技能、儀表板、日誌、資料、關卡、cs.* 與分類／嚴重度／POC 對到既有長條，不是額外欄。仍為 20 欄。`
                : `Primary ${csTr.primary} · support ${csTr.support} · ${csTr.total} total. Click a row to focus that column. This maps the door, wait loop, skills, dashboard, log, data, hops, cs.* and categorize/severity/POC onto existing bars — not extra columns. Still 20 columns.`}
            </p>
          </div>
          <Badge className="bg-teal-50 text-teal-900 border-teal-200">v1.6</Badge>
        </div>

        <h4 className="mt-3 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
          {zh ? "功能對應既有長條" : "Functions on existing bars"}
        </h4>
        <ul className="mt-2 space-y-2 sm:hidden" data-testid="pt-cs-functions-mobile">
          {CS_TR_PROGRESS_FUNCTIONS.map((row) => (
            <li key={row.id} className="rounded-xl border border-[var(--line)] p-3 space-y-1">
              <div className="font-medium break-word">{zh ? row.functionZh : row.functionEn}</div>
              <div>
                {row.columns.map((id) => (
                  <button
                    key={id}
                    type="button"
                    className="mr-1 font-mono text-teal-800 underline-offset-2 hover:underline"
                    onClick={() => focusColumn(id)}
                  >
                    {id}
                  </button>
                ))}
              </div>
              <div className="text-xs text-[var(--muted)] break-word">{zh ? row.proofZh : row.proofEn}</div>
            </li>
          ))}
        </ul>
        <div className="mt-2 overflow-x-auto hidden sm:block">
          <table className="w-full text-xs min-w-[36rem]">
            <thead>
              <tr className="text-left text-[var(--muted)] border-b border-[var(--line)]">
                <th className="py-1.5 pr-2 font-medium">{zh ? "功能" : "Function"}</th>
                <th className="py-1.5 pr-2 font-medium">{zh ? "欄（X）" : "Column (X)"}</th>
                <th className="py-1.5 font-medium">{zh ? "原型證明" : "Prototype proof"}</th>
              </tr>
            </thead>
            <tbody>
              {CS_TR_PROGRESS_FUNCTIONS.map((row) => (
                <tr key={row.id} className="border-b border-[var(--line)] last:border-0">
                  <td className="py-1.5 pr-2 align-top break-word">{zh ? row.functionZh : row.functionEn}</td>
                  <td className="py-1.5 pr-2 align-top">
                    {row.columns.map((id) => (
                      <button
                        key={id}
                        type="button"
                        className="mr-1 font-mono text-teal-800 underline-offset-2 hover:underline"
                        onClick={() => focusColumn(id)}
                      >
                        {id}
                      </button>
                    ))}
                  </td>
                  <td className="py-1.5 align-top text-[var(--muted)] break-word">
                    {zh ? row.proofZh : row.proofEn}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h4 className="mt-4 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
          {zh ? "與開放議題同一八項" : "Same eight issues as Open Issues"}
        </h4>
        <ul className="mt-2 space-y-2 sm:hidden" data-testid="pt-cs-catalogue-mobile">
          {CS_TR_OPEN_ISSUE_CATALOGUE.map((row) => (
            <li key={row.id} className="rounded-xl border border-[var(--line)] p-3 space-y-1">
              <button
                type="button"
                className="font-mono text-teal-800 underline-offset-2 hover:underline"
                onClick={() => focusColumn(row.id)}
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
        <div className="mt-2 overflow-x-auto hidden sm:block">
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
                      onClick={() => focusColumn(row.id)}
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

      <div className="panel p-2 sm:p-4 overflow-x-auto" data-testid="progress-chart">
        <div className="flex items-center justify-between gap-2 mb-2 px-1">
          <span className="text-xs font-semibold text-[var(--muted)]">
            {zh ? "Y · 時間軸（月）" : "Y · Timeline (months)"}
          </span>
          <span className="text-xs font-semibold text-[var(--muted)]">
            {zh ? "X · 開放議題（欄）→" : "X · Open issues (columns) →"}
          </span>
        </div>
        <svg
          viewBox={`0 0 ${Math.max(chartW, labelW + 120)} ${chartH}`}
          className="w-full min-w-[720px] h-auto"
          role="img"
          aria-label={
            zh
              ? "進度追蹤：X＝開放議題，Y＝時間軸至 2027 年底"
              : "Progress tracker: X = open issues, Y = timeline through end-2027"
          }
        >
          <rect
            x={0}
            y={0}
            width={Math.max(chartW, labelW + 120)}
            height={chartH}
            fill="#fff"
          />

          {/* Column headers: issue id + BU */}
          {cols.map((i, col) => {
            const x = labelW + col * colW;
            const active = focus === i.id;
            return (
              <g
                key={`h-${i.id}`}
                role="button"
                tabIndex={0}
                style={{ cursor: "pointer" }}
                onClick={() => setFocus(i.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") setFocus(i.id);
                }}
              >
                <rect
                  x={x}
                  y={4}
                  width={colW - 2}
                  height={headH - 8}
                  rx={4}
                  fill={active ? "#f0fdfa" : "#f8fafc"}
                  stroke={active ? "#0b6e6a" : "#e2e8f0"}
                />
                <text
                  x={x + (colW - 2) / 2}
                  y={22}
                  textAnchor="middle"
                  fontSize={10}
                  fontWeight={700}
                  fill="#0f1b2d"
                  fontFamily="ui-monospace, monospace"
                >
                  {i.id.replace("OI-", "")}
                </text>
                <text
                  x={x + (colW - 2) / 2}
                  y={38}
                  textAnchor="middle"
                  fontSize={8}
                  fontWeight={700}
                  fill="#0b6e6a"
                >
                  {i.bu.length > 8 ? `${i.bu.slice(0, 7)}…` : i.bu}
                </text>
                <text
                  x={x + (colW - 2) / 2}
                  y={52}
                  textAnchor="middle"
                  fontSize={8}
                  fill="#64748b"
                >
                  {ISSUE_STATUS_LABEL[i.status][zh ? "zh-Hant" : "en"].slice(0, 7)}
                </text>
              </g>
            );
          })}

          {/* Month rows + cells */}
          {PROGRESS_TIMELINE.months.map((m, row) => {
            const y = headH + row * rowH;
            const isNow = row === nowIdx;
            return (
              <g key={m}>
                <rect
                  x={0}
                  y={y}
                  width={Math.max(chartW, labelW + 120)}
                  height={rowH}
                  fill={isNow ? "#f0fdfa" : row % 2 ? "#fafafa" : "#fff"}
                />
                <text
                  x={8}
                  y={y + 15}
                  fontSize={10}
                  fontWeight={isNow ? 700 : 500}
                  fill={isNow ? "#0b6e6a" : "#64748b"}
                  fontFamily="ui-monospace, monospace"
                >
                  {m}
                  {isNow ? (zh ? " ·現在" : " ·now") : ""}
                </text>
                <line
                  x1={labelW}
                  y1={y + rowH}
                  x2={labelW + cols.length * colW}
                  y2={y + rowH}
                  stroke="#e2e8f0"
                  strokeWidth={1}
                />

                {cols.map((i, col) => {
                  const active = row >= i.startMonth && row <= i.endMonth;
                  if (!active) return null;
                  const x = labelW + col * colW + 4;
                  return (
                    <rect
                      key={`${i.id}-${m}`}
                      x={x}
                      y={y + 3}
                      width={colW - 10}
                      height={rowH - 6}
                      rx={3}
                      fill={STATUS_COLOR[i.status]}
                      opacity={0.92}
                      style={{ cursor: "pointer" }}
                      onClick={() => setFocus(i.id)}
                    >
                      <title>{`${i.id} · ${i.bu} · ${ISSUE_STATUS_LABEL[i.status].en} · ${m}`}</title>
                    </rect>
                  );
                })}
              </g>
            );
          })}

          {/* Y-axis label gutter line */}
          <line
            x1={labelW}
            y1={headH}
            x2={labelW}
            y2={headH + PROGRESS_TIMELINE.monthCount * rowH}
            stroke="#cbd5e1"
            strokeWidth={1}
          />
        </svg>
      </div>

      {focused && focusedCopy ? (
        <div className="panel p-3 sm:p-4" data-testid="progress-detail">
          <div className="flex flex-wrap gap-2 items-center">
            <span className="font-mono text-sm font-semibold">{focused.id}</span>
            {isCsTrOpenIssue(focused) ? (
              <span className="badge border bg-teal-50 text-teal-900 border-teal-200">CS/TR</span>
            ) : null}
            <span className={`badge border ${statusTone(focused.status)}`}>
              {ISSUE_STATUS_LABEL[focused.status][zh ? "zh-Hant" : "en"]}
            </span>
            <Badge className="bg-slate-100 text-slate-700 border-slate-200">{focused.priority}</Badge>
            <Badge className={`border ${BU_TONE[focused.bu]}`}>
              {zh ? `負責 BU：${focused.bu}` : `Responsible BU: ${focused.bu}`}
            </Badge>
            <Badge className="bg-white text-slate-700 border-slate-200">{focused.area}</Badge>
          </div>
          <h3 className="font-semibold mt-2">{focusedCopy.title}</h3>
          <p className="text-sm text-[var(--muted)] mt-1 break-word">{focusedCopy.detail}</p>
          <dl className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            <div>
              <dt className="text-xs uppercase tracking-wide text-[var(--muted)]">
                {zh ? "暫定 ETA" : "Tentative ETA"}
              </dt>
              <dd className="font-semibold">{focusedCopy.eta}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-[var(--muted)]">
                {zh ? "依賴" : "Dependencies"}
              </dt>
              <dd>{focusedCopy.dependencies}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-[var(--muted)]">
                {zh ? "時間軸（Y）" : "Timeline (Y)"}
              </dt>
              <dd className="font-mono text-xs">
                {PROGRESS_TIMELINE.months[focused.startMonth]} →{" "}
                {PROGRESS_TIMELINE.months[focused.endMonth]}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-[var(--muted)]">
                {zh ? "議題欄（X）" : "Issue column (X)"}
              </dt>
              <dd className="font-mono text-xs">{focused.id}</dd>
            </div>
          </dl>
        </div>
      ) : null}

      <ul className="space-y-2 sm:hidden" data-testid="progress-mobile">
        {cols.map((i) => {
          const copy = zh ? i.zh : i.en;
          return (
            <li
              key={i.id}
              className="panel p-3 space-y-2 cursor-pointer"
              onClick={() => setFocus(i.id)}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs font-semibold">{i.id}</span>
                {isCsTrOpenIssue(i) ? (
                  <span className="badge border bg-teal-50 text-teal-900 border-teal-200">CS/TR</span>
                ) : null}
                <span className={`badge border ${BU_TONE[i.bu]}`}>{i.bu}</span>
                <span className={`badge border ${statusTone(i.status)}`}>
                  {ISSUE_STATUS_LABEL[i.status][zh ? "zh-Hant" : "en"]}
                </span>
              </div>
              <div className="text-sm font-semibold break-words">{copy.title}</div>
              <div className="text-xs text-[var(--muted)] font-mono">
                {PROGRESS_TIMELINE.months[i.startMonth]} → {PROGRESS_TIMELINE.months[i.endMonth]}
              </div>
              <div className="flex gap-0.5 h-2 rounded overflow-hidden bg-slate-100">
                {PROGRESS_TIMELINE.months.map((_, idx) => (
                  <span
                    key={idx}
                    className="flex-1"
                    style={{
                      background:
                        idx >= i.startMonth && idx <= i.endMonth
                          ? STATUS_COLOR[i.status]
                          : "transparent",
                    }}
                  />
                ))}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
