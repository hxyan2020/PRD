"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Badge, StatCard, StatusBadge } from "@/components/ui";
import { EnZh } from "@/components/EnZh";
import { useUiLocale } from "@/hooks/useUiLocale";
import { bumpNavBadge } from "@/lib/nav-badges";
import { MonitorCode } from "@/components/MonitorCode";

type Candidate = {
  id: number;
  candidate_id: string;
  method: string;
  scenario: string;
  proposed_indicator: string;
  proposed_dimension: string;
  proposed_monitor_id: string | null;
  proposed_skill_code: string | null;
  score: number;
  relative_score: number;
  severity: string;
  product: string;
  evidence_json: string;
  status: string;
  change_request_id: string | null;
  skill_code: string | null;
  monitor_id: string | null;
  review_note: string | null;
  reviewed_by_name: string | null;
  reviewed_at: string | null;
  created_at: string;
};

type Scan = {
  scan_id: string;
  started_at: string;
  finished_at: string | null;
  candidates_new: number;
  candidates_total: number;
  status: string;
  trigger_mode: string;
  actor: string | null;
};

type Roles = {
  can_operate: boolean;
  can_review: boolean;
  user_id: number;
  role_code: string;
};

const METHODS: Record<string, { en: string; zh: string }> = {
  isolation_forest: { en: "Isolation Forest", zh: "孤立森林" },
  cusum: { en: "CUSUM regime", zh: "CUSUM 體制" },
  mahalanobis: { en: "Joint distance", zh: "聯合距離" },
  lof: { en: "Local outlier", zh: "局部離群" },
  subgroup: { en: "Subgroup slice", zh: "子群切片" },
  sequence: { en: "Lead-lag sequence", zh: "領先—滯後" },
  corr_network: { en: "Corr. network", zh: "相關網路" },
};

export function DiscoveryBoard({
  initial,
}: {
  initial: {
    candidates: Candidate[];
    scans: Scan[];
    pending_count: number;
    settings: Array<{ key: string; value: string }>;
    roles: Roles;
  };
}) {
  const router = useRouter();
  const { locale } = useUiLocale();
  const [filter, setFilter] = useState<string>("PENDING_RO");
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [candidates, setCandidates] = useState(initial.candidates);
  const [pendingCount, setPendingCount] = useState(initial.pending_count);
  const [selected, setSelected] = useState<string | null>(
    initial.candidates.find((c) => c.status === "PENDING_RO")?.candidate_id ??
      initial.candidates[0]?.candidate_id ??
      null
  );

  useEffect(() => {
    setCandidates(initial.candidates);
    setPendingCount(initial.pending_count);
  }, [initial.candidates, initial.pending_count]);

  const enabled =
    initial.settings.find((s) => s.key === "discovery.enabled")?.value !== "false";

  const filtered = useMemo(() => {
    if (filter === "ALL") return candidates;
    return candidates.filter((c) => c.status === filter);
  }, [filter, candidates]);

  const selectedRow = candidates.find((c) => c.candidate_id === selected) || filtered[0];

  async function scanNow() {
    setBusy("scan");
    setMsg(null);
    const res = await fetch("/api/discovery", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "scan_now" }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(null);
    if (!res.ok) {
      setMsg(data.error || "Scan failed");
      return;
    }
    const n = Number(data.candidates_new || 0);
    setMsg(
      locale === "zh-Hant"
        ? `掃描完成：新增 ${n} 個候選`
        : `Scan complete: ${n} new candidate(s)`
    );
    if (n > 0) bumpNavBadge("/admin/discovery", n);
    router.refresh();
  }

  async function review(action: string) {
    if (!selectedRow) return;
    setBusy(action);
    setMsg(null);
    const res = await fetch("/api/discovery", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "review",
        candidate_id: selectedRow.candidate_id,
        review_action: action,
        comment: comment || undefined,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(null);
    if (!res.ok) {
      setMsg(data.error || "Review failed");
      return;
    }
    if (action === "APPROVE_FOR_MONITORING") {
      setMsg(
        locale === "zh-Hant"
          ? `已核准監控：技能 ${data.skill_code} · 指標 ${data.monitor_id}`
          : `Approved for monitoring: skill ${data.skill_code} · monitor ${data.monitor_id}`
      );
      bumpNavBadge("/admin/skills", 1);
      bumpNavBadge("/admin/monitor-2", 1);
    } else {
      setMsg(locale === "zh-Hant" ? `已記錄：${data.status}` : `Recorded: ${data.status}`);
    }
    setCandidates((prev) =>
      prev.map((c) =>
        c.candidate_id === selectedRow.candidate_id
          ? {
              ...c,
              status: String(data.status || c.status),
              skill_code: data.skill_code ? String(data.skill_code) : c.skill_code,
              monitor_id: data.monitor_id ? String(data.monitor_id) : c.monitor_id,
              change_request_id: data.change_request_id
                ? String(data.change_request_id)
                : c.change_request_id,
              review_note: comment || c.review_note,
              reviewed_by_name: initial.roles.role_code,
            }
          : c
      )
    );
    setPendingCount((n) =>
      ["APPROVE_FOR_MONITORING", "APPROVE_FOR_VALIDATION", "DISMISS"].includes(action)
        ? Math.max(0, n - 1)
        : n
    );
    if (action === "APPROVE_FOR_MONITORING") setFilter("IN_MONITORING");
    setComment("");
    router.refresh();
  }

  return (
    <div className="space-y-4" data-testid="discovery-board">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label={locale === "zh-Hant" ? "待 RO" : "Pending RO"}
          value={pendingCount}
        />
        <StatCard
          label={locale === "zh-Hant" ? "候選總數" : "Candidates"}
          value={candidates.length}
        />
        <StatCard
          label={locale === "zh-Hant" ? "已進監控" : "In monitoring"}
          value={candidates.filter((c) => c.status === "IN_MONITORING").length}
        />
        <StatCard
          label={locale === "zh-Hant" ? "最近掃描" : "Latest scan"}
          value={initial.scans[0]?.candidates_new ?? 0}
          hint={initial.scans[0]?.scan_id}
        />
      </div>

      <div className="panel p-3 sm:p-4 border-amber-200 bg-amber-50/60 text-sm" data-testid="discovery-lane-note">
        <p className="font-semibold">
          <EnZh
            en="Parallel discovery lane — not the DETECT→DASHBOARD spine"
            zh="平行探索通道 — 不是 DETECT→DASHBOARD 脊柱"
          />
        </p>
        <p className="mt-1 text-[var(--muted)]">
          <EnZh
            en="Realtime scans propose unknown risk events and indicators. RO POC approves; only then a skill + Monitor 2.0 target are created (AI Engineer proposes, RO checks). After promotion they join daily detector monitoring."
            zh="即時掃描提出未知風險事件與指標。RO POC 核准後才建立技能與 Monitor 2.0 目標（AI 工程師提案、RO 覆核）。晉升後才加入每日偵測監控。"
          />
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Badge>{enabled ? "ENABLED" : "DISABLED"}</Badge>
          <Badge>{initial.roles.role_code}</Badge>
          {initial.roles.can_operate ? (
            <button
              type="button"
              className="btn btn-primary"
              disabled={busy === "scan"}
              onClick={scanNow}
              data-testid="discovery-scan-now"
            >
              {busy === "scan" ? (
                <EnZh en="Scanning…" zh="掃描中…" />
              ) : (
                <EnZh en="Run discovery now" zh="立即執行探索" />
              )}
            </button>
          ) : null}
          <Link className="btn" href="/admin/ai-admin">
            <EnZh en="AI Admin changes" zh="AI 管理變更" />
          </Link>
          <Link className="btn" href="/admin/skills">
            <EnZh en="Skills" zh="技能" />
          </Link>
        </div>
        {msg ? <p className="mt-2 text-teal-900 font-medium" data-testid="discovery-msg">{msg}</p> : null}
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          ["PENDING_RO", "Pending RO", "待 RO"],
          ["ASK_MORE_INFO", "Ask more", "需更多資訊"],
          ["APPROVED_FOR_VALIDATION", "Validation", "驗證中"],
          ["IN_MONITORING", "Monitoring", "監控中"],
          ["DISMISSED", "Dismissed", "已駁回"],
          ["ALL", "All", "全部"],
        ].map(([code, en, zh]) => (
          <button
            key={code}
            type="button"
            className={`btn h-8 text-xs ${filter === code ? "btn-primary" : ""}`}
            onClick={() => setFilter(code)}
            data-testid={`discovery-filter-${code}`}
          >
            {locale === "zh-Hant" ? zh : en}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        <div className="xl:col-span-2 panel overflow-hidden">
          <div className="border-b border-[var(--line)] px-3 py-2 text-sm font-semibold">
            <EnZh en="Candidates" zh="候選" />
          </div>
          <ul className="divide-y divide-[var(--line)] max-h-[32rem] overflow-auto">
            {filtered.length === 0 ? (
              <li className="p-4 text-sm text-[var(--muted)]">
                <EnZh en="No candidates in this filter." zh="此篩選無候選。" />
              </li>
            ) : (
              filtered.map((c) => {
                const method = METHODS[c.method] || { en: c.method, zh: c.method };
                const active = selectedRow?.candidate_id === c.candidate_id;
                return (
                  <li key={c.candidate_id}>
                    <button
                      type="button"
                      className={`w-full text-left px-3 py-3 transition ${active ? "bg-teal-50" : "hover:bg-slate-50"}`}
                      onClick={() => setSelected(c.candidate_id)}
                      data-testid={`discovery-cand-${c.candidate_id}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-xs text-[var(--muted)] font-mono">{c.candidate_id}</div>
                          <div className="font-semibold text-sm mt-0.5 truncate">
                            {locale === "zh-Hant" ? method.zh : method.en}
                          </div>
                          <div className="text-xs text-[var(--muted)] mt-1 line-clamp-2">{c.proposed_indicator}</div>
                        </div>
                        <div className="shrink-0 flex flex-col items-end gap-1">
                          <StatusBadge value={c.status} />
                          <span className="text-[10px] tabular-nums text-slate-600">
                            {(c.relative_score * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>

        <div className="xl:col-span-3 panel p-4" data-testid="discovery-detail">
          {!selectedRow ? (
            <p className="text-sm text-[var(--muted)]">
              <EnZh en="Select a candidate." zh="請選擇候選。" />
            </p>
          ) : (
            <>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="font-mono text-xs text-[var(--muted)]">{selectedRow.candidate_id}</div>
                  <h2 className="text-lg font-semibold mt-1">{selectedRow.proposed_indicator}</h2>
                  <p className="text-sm text-[var(--muted)] mt-1 leading-relaxed">{selectedRow.scenario}</p>
                </div>
                <StatusBadge value={selectedRow.status} />
              </div>

              <dl className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                <div>
                  <dt className="text-[var(--muted)] text-xs">
                    <EnZh en="Method" zh="方法" />
                  </dt>
                  <dd className="font-medium">
                    {locale === "zh-Hant"
                      ? METHODS[selectedRow.method]?.zh || selectedRow.method
                      : METHODS[selectedRow.method]?.en || selectedRow.method}
                  </dd>
                </div>
                <div>
                  <dt className="text-[var(--muted)] text-xs">
                    <EnZh en="Dimension" zh="維度" />
                  </dt>
                  <dd className="font-medium">{selectedRow.proposed_dimension}</dd>
                </div>
                <div>
                  <dt className="text-[var(--muted)] text-xs">
                    <EnZh en="Severity" zh="嚴重度" />
                  </dt>
                  <dd className="font-medium">{selectedRow.severity}</dd>
                </div>
                <div>
                  <dt className="text-[var(--muted)] text-xs">
                    <EnZh en="Proposed monitor" zh="提案指標" />
                  </dt>
                  <dd>
                    <MonitorCode id={selectedRow.proposed_monitor_id || "—"} />
                  </dd>
                </div>
                <div>
                  <dt className="text-[var(--muted)] text-xs">
                    <EnZh en="Proposed skill" zh="提案技能" />
                  </dt>
                  <dd className="font-mono text-xs">{selectedRow.proposed_skill_code || "—"}</dd>
                </div>
                <div>
                  <dt className="text-[var(--muted)] text-xs">
                    <EnZh en="Score" zh="分數" />
                  </dt>
                  <dd className="font-medium tabular-nums">
                    {selectedRow.score.toFixed(3)} · rel {(selectedRow.relative_score * 100).toFixed(0)}%
                  </dd>
                </div>
              </dl>

              {selectedRow.skill_code || selectedRow.monitor_id ? (
                <div className="mt-3 rounded-lg bg-teal-50 border border-teal-200 p-3 text-sm">
                  <EnZh en="Promoted into daily monitoring:" zh="已晉升至每日監控：" />{" "}
                  <span className="font-mono">{selectedRow.skill_code}</span>
                  {" · "}
                  <MonitorCode id={selectedRow.monitor_id || ""} />
                  {selectedRow.change_request_id ? (
                    <span className="block text-xs text-[var(--muted)] mt-1">
                      CR {selectedRow.change_request_id}
                    </span>
                  ) : null}
                </div>
              ) : null}

              <pre className="mt-3 max-h-40 overflow-auto rounded-lg bg-slate-950 text-slate-100 text-[11px] p-3">
                {JSON.stringify(JSON.parse(selectedRow.evidence_json || "{}"), null, 2)}
              </pre>

              {initial.roles.can_review &&
              ["PENDING_RO", "ASK_MORE_INFO", "APPROVED_FOR_VALIDATION"].includes(selectedRow.status) ? (
                <div className="mt-4 space-y-2 border-t border-[var(--line)] pt-4">
                  <label className="block text-xs font-semibold text-[var(--muted)]">
                    <EnZh en="RO comment / question" zh="RO 意見／問題" />
                    <textarea
                      className="mt-1 w-full rounded-md border border-[var(--line)] p-2 text-sm"
                      rows={2}
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      data-testid="discovery-comment"
                    />
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="btn btn-primary"
                      disabled={!!busy}
                      onClick={() => review("APPROVE_FOR_MONITORING")}
                      data-testid="discovery-approve-monitoring"
                    >
                      <EnZh en="Approve for monitoring" zh="核准納入監控" />
                    </button>
                    <button
                      type="button"
                      className="btn"
                      disabled={!!busy}
                      onClick={() => review("APPROVE_FOR_VALIDATION")}
                      data-testid="discovery-approve-validation"
                    >
                      <EnZh en="Approve for validation" zh="核准進入驗證" />
                    </button>
                    <button
                      type="button"
                      className="btn"
                      disabled={!!busy}
                      onClick={() => review("ASK_MORE_INFO")}
                      data-testid="discovery-ask-more"
                    >
                      <EnZh en="Ask more info" zh="要求更多資訊" />
                    </button>
                    <button
                      type="button"
                      className="btn"
                      disabled={!!busy}
                      onClick={() => review("DISMISS")}
                      data-testid="discovery-dismiss"
                    >
                      <EnZh en="Dismiss" zh="駁回" />
                    </button>
                  </div>
                  <p className="text-xs text-[var(--muted)]">
                    <EnZh
                      en="Approve for monitoring proposes as AI Engineer then RO decides (maker ≠ checker). No silent deploy."
                      zh="核准納入監控時由 AI 工程師提案、RO 覆核（制作者≠覆核者）。不會靜默部署。"
                    />
                  </p>
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>

      <div className="panel overflow-hidden">
        <div className="border-b border-[var(--line)] px-3 py-2 text-sm font-semibold">
          <EnZh en="Recent scans" zh="最近掃描" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-[var(--muted)]">
              <tr>
                <th className="px-3 py-2">Scan</th>
                <th className="px-3 py-2">Mode</th>
                <th className="px-3 py-2">New</th>
                <th className="px-3 py-2">Total</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">When</th>
              </tr>
            </thead>
            <tbody>
              {initial.scans.map((s) => (
                <tr key={s.scan_id} className="border-t border-[var(--line)]">
                  <td className="px-3 py-2 font-mono text-xs">{s.scan_id}</td>
                  <td className="px-3 py-2">{s.trigger_mode}</td>
                  <td className="px-3 py-2 tabular-nums">{s.candidates_new}</td>
                  <td className="px-3 py-2 tabular-nums">{s.candidates_total}</td>
                  <td className="px-3 py-2">
                    <StatusBadge value={s.status} />
                  </td>
                  <td className="px-3 py-2 text-xs text-[var(--muted)]">{s.started_at}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
