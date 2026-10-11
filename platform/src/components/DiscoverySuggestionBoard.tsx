"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Badge, StatCard, StatusBadge } from "@/components/ui";
import { EnZh } from "@/components/EnZh";
import { useUiLocale } from "@/hooks/useUiLocale";
import { bumpNavBadge } from "@/lib/nav-badges";
import { MonitorCode } from "@/components/MonitorCode";
import { RISK_DISCOVERY_NOTEBOOK } from "@/lib/ai/discovery-links";

type DiscoverySuggestion = {
  assessment: string;
  possible_root_causes: string[];
  proposed_risk_scenario: string;
  proposed_indicator_formula: string;
  proposed_dimensions: string[];
  recommended_validation_steps: string[];
  limitations: string[];
  priority: string;
  confidence: string;
  analysis_source: string;
  model?: string | null;
};

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
  window_start: string | null;
  window_end: string | null;
  created_at: string;
};

type AiStatus = {
  mode: string;
  model: string | null;
  key_configured: boolean;
  can_go_live: boolean;
};

type Roles = {
  can_operate: boolean;
  can_review: boolean;
  user_id: number;
  role_code: string;
  user_name: string;
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

function SuggestionCard({
  suggestion,
  locale,
}: {
  suggestion: DiscoverySuggestion;
  locale: string;
}) {
  const zh = locale === "zh-Hant";
  const rows: Array<[string, string, ReactNode]> = [
    [zh ? "評估" : "Assessment", "assessment", suggestion.assessment],
    [
      zh ? "可能根因" : "Possible root causes",
      "causes",
      <ul key="c" className="list-disc pl-5 space-y-0.5">
        {suggestion.possible_root_causes.map((x) => (
          <li key={x}>{x}</li>
        ))}
      </ul>,
    ],
    [zh ? "提案風險情境" : "Proposed risk scenario", "scenario", suggestion.proposed_risk_scenario],
    [
      zh ? "提案指標公式" : "Proposed indicator formula",
      "formula",
      suggestion.proposed_indicator_formula,
    ],
    [
      zh ? "提案維度" : "Proposed dimensions",
      "dims",
      suggestion.proposed_dimensions.join(", ") || "—",
    ],
    [
      zh ? "建議驗證步驟" : "Recommended validation",
      "steps",
      <ol key="s" className="list-decimal pl-5 space-y-0.5">
        {suggestion.recommended_validation_steps.map((x) => (
          <li key={x}>{x}</li>
        ))}
      </ol>,
    ],
    [
      zh ? "限制" : "Limitations",
      "lim",
      <ul key="l" className="list-disc pl-5 space-y-0.5">
        {suggestion.limitations.map((x) => (
          <li key={x}>{x}</li>
        ))}
      </ul>,
    ],
  ];

  return (
    <article
      className="rounded-xl border border-teal-200 bg-white shadow-sm overflow-hidden"
      data-testid="discovery-suggestion-card"
    >
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-teal-100 bg-teal-50 px-4 py-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.12em] text-teal-800">
            <EnZh en="AI suggestion card" zh="AI 建議卡" />
          </div>
          <p className="text-xs text-[var(--muted)] mt-0.5">
            <EnZh
              en="Same structured fields as the Colab notebook review UI — not an approval."
              zh="與 Colab 筆記本審查 UI 相同的結構化欄位 — 這不是核准。"
            />
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Badge>{suggestion.analysis_source}</Badge>
          <Badge>
            {zh ? "優先" : "Priority"} {suggestion.priority}
          </Badge>
          <Badge>
            {zh ? "信心" : "Confidence"} {suggestion.confidence}
          </Badge>
          {suggestion.model ? <Badge>{suggestion.model}</Badge> : null}
        </div>
      </header>
      <dl className="divide-y divide-[var(--line)]">
        {rows.map(([label, key, value]) => (
          <div key={key} className="px-4 py-3 grid sm:grid-cols-[10rem_1fr] gap-1 sm:gap-3 text-sm">
            <dt className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide">{label}</dt>
            <dd className="leading-relaxed text-slate-800">{value}</dd>
          </div>
        ))}
      </dl>
    </article>
  );
}

export function DiscoverySuggestionBoard({
  initial,
}: {
  initial: {
    candidates: Candidate[];
    scans: Array<{
      scan_id: string;
      started_at: string;
      candidates_new: number;
      candidates_total: number;
      status: string;
      trigger_mode: string;
    }>;
    pending_count: number;
    settings: Array<{ key: string; value: string }>;
    roles: Roles;
    ai_status: AiStatus;
  };
}) {
  const router = useRouter();
  const { locale } = useUiLocale();
  const [candidates, setCandidates] = useState(initial.candidates);
  const [pendingCount, setPendingCount] = useState(initial.pending_count);
  const [aiStatus, setAiStatus] = useState(initial.ai_status);
  const [selected, setSelected] = useState(
    initial.candidates.find((c) => c.status === "PENDING_RO")?.candidate_id ??
      initial.candidates[0]?.candidate_id ??
      ""
  );
  const [reviewer, setReviewer] = useState(initial.roles.user_name || "DEMO_RISK_OWNER");
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<DiscoverySuggestion | null>(null);
  const [filter, setFilter] = useState("PENDING_RO");

  const enabled =
    initial.settings.find((s) => s.key === "discovery.enabled")?.value !== "false";

  const filtered = useMemo(() => {
    if (filter === "ALL") return candidates;
    return candidates.filter((c) => c.status === filter);
  }, [filter, candidates]);

  const selectedRow =
    candidates.find((c) => c.candidate_id === selected) ||
    filtered[0] ||
    candidates[0];

  async function post(body: Record<string, unknown>) {
    const res = await fetch("/api/discovery", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Request failed");
    return data;
  }

  async function scanNow() {
    setBusy("scan");
    setMsg(null);
    try {
      const data = await post({ action: "scan_now" });
      const n = Number(data.candidates_new || 0);
      setMsg(
        locale === "zh-Hant" ? `掃描完成：新增 ${n} 個候選` : `Scan complete: ${n} new candidate(s)`
      );
      if (n > 0) bumpNavBadge("/admin/discovery", n);
      router.refresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  }

  async function setAiMode(live: boolean) {
    setBusy(live ? "connect" : "disconnect");
    setMsg(null);
    try {
      const data = await post({ action: live ? "connect_openai" : "disconnect_openai" });
      setAiStatus(data.status || data);
      setMsg(
        live
          ? locale === "zh-Hant"
            ? `已連線 OpenAI（${data.status?.model || "live"}）— 分析才會呼叫 API`
            : `Live OpenAI (${data.status?.model || "live"}) — no call until Analyse`
          : locale === "zh-Hant"
            ? "已切換 Mock — 不呼叫外部 API"
            : "Mock mode — no external AI calls"
      );
    } catch (e) {
      setMsg(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  }

  async function analyseSelected() {
    if (!selectedRow) return;
    setBusy("analyse");
    setMsg(null);
    try {
      const data = await post({
        action: "analyse",
        candidate_id: selectedRow.candidate_id,
        followup: question || undefined,
        locale,
      });
      setSuggestion(data.suggestion as DiscoverySuggestion);
      setMsg(
        locale === "zh-Hant"
          ? `分析模式：${data.suggestion?.analysis_source || aiStatus.mode}`
          : `Analysis mode: ${data.suggestion?.analysis_source || aiStatus.mode}`
      );
    } catch (e) {
      setMsg(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  }

  async function review(action: string) {
    if (!selectedRow) return;
    setBusy(action);
    setMsg(null);
    try {
      const data = await post({
        action: "review",
        candidate_id: selectedRow.candidate_id,
        review_action: action,
        comment: question || undefined,
        reviewer_name: reviewer,
        locale,
      });
      if (data.suggestion) {
        setSuggestion(data.suggestion as DiscoverySuggestion);
      }
      if (action === "APPROVE_FOR_MONITORING") {
        setMsg(
          locale === "zh-Hant"
            ? `已核准監控：技能 ${data.skill_code} · 指標 ${data.monitor_id}`
            : `Approved for monitoring: skill ${data.skill_code} · monitor ${data.monitor_id}`
        );
        bumpNavBadge("/admin/skills", 1);
        bumpNavBadge("/admin/monitor-2", 1);
      } else if (action === "ASK_MORE_INFO") {
        setMsg(
          locale === "zh-Hant"
            ? "已要求更多資訊 — AI 回覆不是核准"
            : "Asked for more info — AI reply is never an approval"
        );
      } else if (action === "APPROVE_FOR_VALIDATION") {
        setMsg(
          locale === "zh-Hant"
            ? "已核准進入驗證／UAT — 未變更生產規則"
            : "Approved for validation/UAT — no production rule changed"
        );
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
                review_note: question || c.review_note,
              }
            : c
        )
      );
      if (["APPROVE_FOR_MONITORING", "APPROVE_FOR_VALIDATION", "DISMISS"].includes(action)) {
        setPendingCount((n) => Math.max(0, n - 1));
      }
      if (action === "APPROVE_FOR_MONITORING") setFilter("IN_MONITORING");
      else if (action === "APPROVE_FOR_VALIDATION") setFilter("APPROVED_FOR_VALIDATION");
      router.refresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  }

  const methodLabel = selectedRow
    ? locale === "zh-Hant"
      ? METHODS[selectedRow.method]?.zh || selectedRow.method
      : METHODS[selectedRow.method]?.en || selectedRow.method
    : "";

  return (
    <div className="space-y-4" data-testid="discovery-suggestion-board">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label={locale === "zh-Hant" ? "待 RO" : "Pending RO"} value={pendingCount} />
        <StatCard label={locale === "zh-Hant" ? "候選總數" : "Candidates"} value={candidates.length} />
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

      <div className="panel p-3 sm:p-4 border-amber-200 bg-amber-50/70 text-sm space-y-2">
        <p className="font-semibold">
          <EnZh
            en="Notebook-parity AI suggestion review (CRMP Admin)"
            zh="與筆記本對齊的 AI 建議審查（CRMP 管理後台）"
          />
        </p>
        <p className="text-[var(--muted)]">
          <EnZh
            en="Connect OpenAI / Mock → Analyse selected → structured suggestion card. Approve for validation / Ask more info / Dismiss match the Colab widgets. Approve never auto-deploys. Optional Approve for monitoring promotes skill + Monitor 2.0 via maker≠checker."
            zh="連線 OpenAI／Mock → 分析所選 → 結構化建議卡。核准驗證／要求更多資訊／駁回與 Colab 元件一致。核准不會自動部署。可選「核准納入監控」經制作者≠覆核者晉升技能＋Monitor 2.0。"
          />
        </p>
        <div className="flex flex-wrap gap-2 items-center">
          <Badge>
            {enabled ? (
              <EnZh en="ENABLED" zh="已啟用" />
            ) : (
              <EnZh en="DISABLED" zh="已停用" />
            )}
          </Badge>
          <Badge data-testid="discovery-ai-mode">
            AI: {aiStatus.mode === "LIVE_OPENAI" ? `LIVE (${aiStatus.model})` : "MOCK"}
          </Badge>
          <a className="btn" href={RISK_DISCOVERY_NOTEBOOK.html} target="_blank" rel="noreferrer">
            <EnZh en="Open notebook (HTML)" zh="開啟筆記本（HTML）" />
          </a>
          <a className="btn" href={RISK_DISCOVERY_NOTEBOOK.colab} target="_blank" rel="noreferrer">
            <EnZh en="Open Colab" zh="開啟 Colab" />
          </a>
          <Link
            className="btn"
            href={locale === "zh-Hant" ? "/admin/docs/user-guide?lang=zh-Hant" : "/admin/docs/user-guide"}
          >
            <EnZh en="Methods & flow (docs)" zh="方法與流程（文件）" />
          </Link>
        </div>
      </div>

      {/* Notebook widget strip */}
      <section className="panel p-4 space-y-3" data-testid="discovery-notebook-controls">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold" data-testid="discovery-ai-status-label">
            <EnZh
              en={
                aiStatus.mode === "LIVE_OPENAI"
                  ? `AI: LIVE OpenAI (${aiStatus.model}) — API calls cost tokens`
                  : "AI: MOCK — no API calls"
              }
              zh={
                aiStatus.mode === "LIVE_OPENAI"
                  ? `AI：即時 OpenAI（${aiStatus.model}）— API 會產生費用`
                  : "AI：Mock — 不呼叫 API"
              }
            />
          </span>
          {initial.roles.can_operate || initial.roles.can_review ? (
            <>
              <button
                type="button"
                className="btn btn-primary"
                disabled={!!busy}
                onClick={() => setAiMode(true)}
                data-testid="discovery-connect-openai"
              >
                <EnZh en="Connect OpenAI (Secrets/env)" zh="連線 OpenAI（Secrets／環境變數）" />
              </button>
              <button
                type="button"
                className="btn"
                disabled={!!busy}
                onClick={() => setAiMode(false)}
                data-testid="discovery-disconnect-openai"
              >
                <EnZh en="Disconnect / Mock" zh="中斷／Mock" />
              </button>
            </>
          ) : null}
          {initial.roles.can_operate ? (
            <button
              type="button"
              className="btn"
              disabled={busy === "scan"}
              onClick={scanNow}
              data-testid="discovery-scan-now"
            >
              <EnZh en="Run discovery now" zh="立即執行探索" />
            </button>
          ) : null}
        </div>

        <label className="block text-xs font-semibold text-[var(--muted)]">
          <EnZh en="Candidate" zh="候選" />
          <select
            className="mt-1 w-full rounded-md border border-[var(--line)] p-2 text-sm"
            value={selectedRow?.candidate_id || ""}
            onChange={(e) => {
              setSelected(e.target.value);
              setSuggestion(null);
            }}
            data-testid="discovery-candidate-select"
          >
            {(filter === "ALL" ? candidates : filtered).map((c) => (
              <option key={c.candidate_id} value={c.candidate_id}>
                {c.method} | {c.scenario.slice(0, 60)} | {c.candidate_id}
              </option>
            ))}
          </select>
        </label>

        <div className="grid sm:grid-cols-2 gap-3">
          <label className="block text-xs font-semibold text-[var(--muted)]">
            <EnZh en="Reviewer" zh="審查人" />
            <input
              className="mt-1 w-full rounded-md border border-[var(--line)] p-2 text-sm"
              value={reviewer}
              onChange={(e) => setReviewer(e.target.value)}
              data-testid="discovery-reviewer"
            />
          </label>
          <label className="block text-xs font-semibold text-[var(--muted)] sm:col-span-2">
            <EnZh en="Question / reason" zh="問題／理由" />
            <textarea
              className="mt-1 w-full rounded-md border border-[var(--line)] p-2 text-sm"
              rows={2}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              data-testid="discovery-comment"
            />
          </label>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="btn btn-primary"
            disabled={!!busy || !selectedRow}
            onClick={analyseSelected}
            data-testid="discovery-analyse"
          >
            <EnZh en="Analyse selected" zh="分析所選" />
          </button>
          {initial.roles.can_review ? (
            <>
              <button
                type="button"
                className="btn"
                disabled={!!busy || !selectedRow}
                onClick={() => review("APPROVE_FOR_VALIDATION")}
                data-testid="discovery-approve-validation"
              >
                <EnZh en="Approve for validation" zh="核准進入驗證" />
              </button>
              <button
                type="button"
                className="btn"
                disabled={!!busy || !selectedRow}
                onClick={() => review("ASK_MORE_INFO")}
                data-testid="discovery-ask-more"
              >
                <EnZh en="Ask for more info" zh="要求更多資訊" />
              </button>
              <button
                type="button"
                className="btn"
                disabled={!!busy || !selectedRow}
                onClick={() => review("DISMISS")}
                data-testid="discovery-dismiss"
              >
                <EnZh en="Dismiss" zh="駁回" />
              </button>
              <button
                type="button"
                className="btn"
                disabled={!!busy || !selectedRow}
                onClick={() => review("APPROVE_FOR_MONITORING")}
                data-testid="discovery-approve-monitoring"
                title="Beyond notebook — promotes skill + monitor via maker≠checker"
              >
                <EnZh en="Approve for monitoring" zh="核准納入監控" />
              </button>
            </>
          ) : null}
        </div>
        {msg ? (
          <p className="text-sm font-medium text-teal-900" data-testid="discovery-msg">
            {msg}
          </p>
        ) : null}
        <p className="text-xs text-[var(--muted)]">
          <EnZh
            en="Ask for more info may refresh the AI suggestion card; that response is never treated as approval. A human owns every review decision."
            zh="要求更多資訊可能刷新 AI 建議卡；該回覆絕不視為核准。每次審查決策皆由人類負責。"
          />
        </p>
      </section>

      {suggestion ? <SuggestionCard suggestion={suggestion} locale={locale} /> : null}

      {selectedRow ? (
        <section className="panel p-4" data-testid="discovery-candidate-detail">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <div className="font-mono text-xs text-[var(--muted)]">{selectedRow.candidate_id}</div>
              <h2 className="text-lg font-semibold mt-1">{selectedRow.proposed_indicator}</h2>
              <p className="text-sm text-[var(--muted)] mt-1">{selectedRow.scenario}</p>
            </div>
            <StatusBadge value={selectedRow.status} />
          </div>
          <dl className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
            <div>
              <dt className="text-xs text-[var(--muted)]">
                <EnZh en="Method" zh="方法" />
              </dt>
              <dd className="font-medium">{methodLabel}</dd>
            </div>
            <div>
              <dt className="text-xs text-[var(--muted)]">
                <EnZh en="Dimension" zh="維度" />
              </dt>
              <dd className="font-medium">{selectedRow.proposed_dimension}</dd>
            </div>
            <div>
              <dt className="text-xs text-[var(--muted)]">
                <EnZh en="Severity" zh="嚴重度" />
              </dt>
              <dd className="font-medium">{selectedRow.severity}</dd>
            </div>
            <div>
              <dt className="text-xs text-[var(--muted)]">
                <EnZh en="Proposed monitor" zh="提案指標" />
              </dt>
              <dd>
                <MonitorCode id={selectedRow.proposed_monitor_id || "—"} />
              </dd>
            </div>
            <div>
              <dt className="text-xs text-[var(--muted)]">
                <EnZh en="Proposed skill" zh="提案技能" />
              </dt>
              <dd className="font-mono text-xs">{selectedRow.proposed_skill_code || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-[var(--muted)]">
                <EnZh en="Score" zh="分數" />
              </dt>
              <dd className="tabular-nums font-medium">
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
            </div>
          ) : null}
          <pre className="mt-3 max-h-36 overflow-auto rounded-lg bg-slate-950 text-slate-100 text-[11px] p-3">
            {JSON.stringify(JSON.parse(selectedRow.evidence_json || "{}"), null, 2)}
          </pre>
        </section>
      ) : null}

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
          >
            {locale === "zh-Hant" ? zh : en}
          </button>
        ))}
      </div>
    </div>
  );
}
