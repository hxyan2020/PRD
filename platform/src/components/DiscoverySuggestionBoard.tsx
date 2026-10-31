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
  thinking_steps?: string[];
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
  auto_live?: boolean;
  operator_forced_mock?: boolean;
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
    ...(suggestion.thinking_steps?.length
      ? ([
          [
            zh ? "思考步驟" : "Thinking steps",
            "thinking",
            <ol key="t" className="list-decimal pl-5 space-y-0.5 font-mono text-xs">
              {suggestion.thinking_steps.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ol>,
          ],
        ] as Array<[string, string, ReactNode]>)
      : []),
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
      detail_json?: string;
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
  const [showEvidence, setShowEvidence] = useState(false);
  const [scanTrail, setScanTrail] = useState<{
    scan_id: string;
    scan_seed?: string;
    data_source?: string;
    thinking_steps: string[];
  } | null>(() => {
    const latest = initial.scans[0];
    if (!latest?.detail_json) return null;
    try {
      const d = JSON.parse(latest.detail_json) as {
        thinking_steps?: string[];
        scan_seed?: string;
        data_source?: string;
      };
      if (!d.thinking_steps?.length) return null;
      return {
        scan_id: latest.scan_id,
        scan_seed: d.scan_seed,
        data_source: d.data_source,
        thinking_steps: d.thinking_steps,
      };
    } catch {
      return null;
    }
  });

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

  const filterTabs = [
    ["PENDING_RO", "Pending RO", "待 RO"],
    ["ASK_MORE_INFO", "Ask more", "需更多資訊"],
    ["APPROVED_FOR_VALIDATION", "Validation", "驗證中"],
    ["IN_MONITORING", "Monitoring", "監控中"],
    ["DISMISSED", "Dismissed", "已駁回"],
    ["ALL", "All", "全部"],
  ] as const;

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
      const steps = Array.isArray(data.thinking_steps)
        ? (data.thinking_steps as string[])
        : Array.isArray(data.detail?.thinking_steps)
          ? (data.detail.thinking_steps as string[])
          : [];
      if (steps.length) {
        setScanTrail({
          scan_id: String(data.scan_id || ""),
          scan_seed: data.scan_seed ? String(data.scan_seed) : data.detail?.scan_seed,
          data_source: data.data_source
            ? String(data.data_source)
            : data.detail?.data_source
              ? String(data.detail.data_source)
              : undefined,
          thinking_steps: steps,
        });
      }
      setMsg(
        locale === "zh-Hant"
          ? `掃描完成：新增 ${n} 個候選 · 來源 ${data.data_source || "sqlite"} · seed ${data.scan_seed || "—"}`
          : `Scan complete: ${n} new candidate(s) · source ${data.data_source || "sqlite"} · seed ${data.scan_seed || "—"}`
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
        <div className="panel p-4 border-amber-200 bg-amber-50/50">
          <div className="text-xs uppercase tracking-[0.08em] text-[var(--muted)]">
            {locale === "zh-Hant" ? "待 RO" : "Pending RO"}
          </div>
          <div className="mt-2 text-2xl font-semibold tabular-nums text-amber-900">{pendingCount}</div>
        </div>
        <StatCard label={locale === "zh-Hant" ? "候選總數" : "Candidates"} value={candidates.length} />
        <div className="panel p-4 border-emerald-200 bg-emerald-50/40">
          <div className="text-xs uppercase tracking-[0.08em] text-[var(--muted)]">
            {locale === "zh-Hant" ? "已進監控" : "In monitoring"}
          </div>
          <div className="mt-2 text-2xl font-semibold tabular-nums text-emerald-900">
            {candidates.filter((c) => c.status === "IN_MONITORING").length}
          </div>
        </div>
        <StatCard
          label={locale === "zh-Hant" ? "最近掃描" : "Latest scan"}
          value={initial.scans[0]?.candidates_new ?? 0}
          hint={initial.scans[0]?.scan_id}
        />
      </div>

      <div className="panel p-3 sm:p-4 border-[var(--line)] bg-gradient-to-r from-slate-50 to-white text-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 max-w-3xl space-y-1">
            <p className="font-semibold text-slate-900">
              <EnZh
                en="Notebook-parity AI suggestion review"
                zh="與筆記本對齊的 AI 建議審查"
              />
            </p>
            <p className="text-[var(--muted)] text-[13px] leading-relaxed">
              <EnZh
                en="1 Scan on live SQLite seed (stat/ML process trail) → 2 Connect AI → 3 Analyse (fresh thinking each trigger) → 4 RO review. Approve never auto-deploys; monitoring promote needs maker≠checker."
                zh="① 以即時 SQLite 種子掃描（統計／ML 過程軌跡）→ ② 連線 AI → ③ 分析（每次觸發重新思考）→ ④ RO 審查。核准不會自動部署；納入監控需 Maker≠Checker。"
              />
            </p>
          </div>
          <div className="flex flex-wrap gap-2 items-center shrink-0">
            <Badge className={enabled ? "bg-emerald-100 text-emerald-900 border-emerald-200" : "bg-slate-100"}>
              {enabled ? <EnZh en="ENABLED" zh="已啟用" /> : <EnZh en="DISABLED" zh="已停用" />}
            </Badge>
            <Badge data-testid="discovery-ai-mode">
              AI: {aiStatus.mode === "LIVE_OPENAI" ? `LIVE (${aiStatus.model})` : "MOCK"}
            </Badge>
            <a
              className="btn btn-primary !min-h-9 text-xs"
              href={RISK_DISCOVERY_NOTEBOOK.colab}
              target="_blank"
              rel="noreferrer"
              data-testid="discovery-notebook-colab"
            >
              <EnZh en="Open Jupyter (Colab)" zh="開啟 Jupyter（Colab）" />
            </a>
            <a
              className="btn !min-h-9 text-xs"
              href={RISK_DISCOVERY_NOTEBOOK.html}
              target="_blank"
              rel="noreferrer"
              data-testid="discovery-notebook-html"
            >
              <EnZh en="Open notebook (HTML)" zh="開啟筆記本（HTML）" />
            </a>
            <a
              className="btn !min-h-9 text-xs"
              href={RISK_DISCOVERY_NOTEBOOK.ipynb}
              target="_blank"
              rel="noreferrer"
              data-testid="discovery-notebook-ipynb"
            >
              <EnZh en="Download .ipynb" zh="下載 .ipynb" />
            </a>
            <Link
              className="btn !min-h-9 text-xs"
              href={locale === "zh-Hant" ? "/admin/docs/user-guide?lang=zh-Hant" : "/admin/docs/user-guide"}
            >
              <EnZh en="Methods & flow (docs)" zh="方法與流程（文件）" />
            </Link>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-[minmax(260px,320px)_minmax(0,1fr)] gap-4 items-start">
        {/* Left: candidate queue */}
        <aside className="panel p-3 space-y-3 lg:sticky lg:top-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold">
              <EnZh en="Candidate queue" zh="候選佇列" />
            </h2>
            <span className="text-xs text-[var(--muted)] tabular-nums">{filtered.length}</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {filterTabs.map(([code, en, zh]) => (
              <button
                key={code}
                type="button"
                className={`btn !min-h-8 !px-2.5 text-[11px] ${filter === code ? "btn-primary" : ""}`}
                onClick={() => setFilter(code)}
              >
                {locale === "zh-Hant" ? zh : en}
              </button>
            ))}
          </div>
          <label className="sr-only">
            <EnZh en="Candidate" zh="候選" />
            <select
              className="mt-1 w-full rounded-md border border-[var(--line)] p-2 text-sm"
              value={selectedRow?.candidate_id || ""}
              onChange={(e) => {
                setSelected(e.target.value);
                setSuggestion(null);
                setShowEvidence(false);
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
          <ul className="space-y-2 max-h-[32rem] overflow-auto pr-0.5" data-testid="discovery-candidate-list">
            {filtered.map((c) => {
              const active = c.candidate_id === selectedRow?.candidate_id;
              const mLabel =
                locale === "zh-Hant" ? METHODS[c.method]?.zh || c.method : METHODS[c.method]?.en || c.method;
              return (
                <li key={c.candidate_id}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelected(c.candidate_id);
                      setSuggestion(null);
                      setShowEvidence(false);
                    }}
                    className={`w-full text-left rounded-xl border px-3 py-2.5 transition ${
                      active
                        ? "border-teal-400 bg-teal-50 shadow-sm"
                        : "border-[var(--line)] bg-white hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex flex-wrap items-center gap-1.5">
                      <StatusBadge value={c.status} />
                      <Badge className="text-[10px]">{mLabel}</Badge>
                    </div>
                    <div className="mt-1.5 text-sm font-semibold line-clamp-2">{c.proposed_indicator}</div>
                    <div className="mt-1 text-[11px] text-[var(--muted)] line-clamp-2">{c.scenario}</div>
                    <div className="mt-1.5 flex flex-wrap gap-2 text-[11px] text-[var(--muted)]">
                      <span className="font-mono">{c.candidate_id.slice(0, 14)}</span>
                      <span className="tabular-nums">
                        {(c.relative_score * 100).toFixed(0)}% · {c.severity}
                      </span>
                    </div>
                  </button>
                </li>
              );
            })}
            {!filtered.length ? (
              <li className="text-sm text-[var(--muted)] p-2">
                <EnZh en="No candidates in this filter." zh="此篩選尚無候選。" />
              </li>
            ) : null}
          </ul>
        </aside>

        {/* Right: workspace */}
        <div className="space-y-4 min-w-0">
          <section className="panel p-4 space-y-3" data-testid="discovery-notebook-controls">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-teal-800">
                  <EnZh en="Step 1 · Connect & scan" zh="步驟 1 · 連線與掃描" />
                </div>
                <p className="text-sm font-semibold mt-0.5" data-testid="discovery-ai-status-label">
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
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {initial.roles.can_operate || initial.roles.can_review ? (
                  <>
                    <button
                      type="button"
                      className="btn btn-primary !min-h-10 text-xs"
                      disabled={!!busy}
                      onClick={() => setAiMode(true)}
                      data-testid="discovery-connect-openai"
                    >
                      <EnZh en="Connect OpenAI" zh="連線 OpenAI（Secrets／環境變數）" />
                    </button>
                    <button
                      type="button"
                      className="btn !min-h-10 text-xs"
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
                    className="btn !min-h-10 text-xs"
                    disabled={busy === "scan"}
                    onClick={scanNow}
                    data-testid="discovery-scan-now"
                  >
                    <EnZh en="Run discovery now" zh="立即執行探索" />
                  </button>
                ) : null}
              </div>
            </div>
            {scanTrail?.thinking_steps?.length ? (
              <div
                className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 space-y-2"
                data-testid="discovery-scan-thinking"
              >
                <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-700">
                  <EnZh en="Scan process trail" zh="掃描過程軌跡" />
                  <Badge className="normal-case tracking-normal font-mono text-[10px]">
                    {scanTrail.scan_id}
                  </Badge>
                  {scanTrail.data_source ? (
                    <Badge className="normal-case tracking-normal text-[10px]">
                      {scanTrail.data_source}
                    </Badge>
                  ) : null}
                  {scanTrail.scan_seed ? (
                    <Badge className="normal-case tracking-normal font-mono text-[10px]">
                      seed {scanTrail.scan_seed}
                    </Badge>
                  ) : null}
                </div>
                <ol className="list-decimal pl-5 space-y-0.5 font-mono text-xs text-slate-800">
                  {scanTrail.thinking_steps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
              </div>
            ) : null}
          </section>

          {selectedRow ? (
            <section className="panel p-4 space-y-4" data-testid="discovery-candidate-detail">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-mono text-xs text-[var(--muted)]">{selectedRow.candidate_id}</div>
                  <h2 className="text-lg font-semibold mt-1 tracking-tight">{selectedRow.proposed_indicator}</h2>
                  <p className="text-sm text-[var(--muted)] mt-1 leading-relaxed">{selectedRow.scenario}</p>
                </div>
                <StatusBadge value={selectedRow.status} />
              </div>
              <dl className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm rounded-xl border border-[var(--line)] bg-slate-50/70 p-3">
                <div>
                  <dt className="text-xs text-[var(--muted)]">
                    <EnZh en="Method" zh="方法" />
                  </dt>
                  <dd className="font-medium mt-0.5">{methodLabel}</dd>
                </div>
                <div>
                  <dt className="text-xs text-[var(--muted)]">
                    <EnZh en="Dimension" zh="維度" />
                  </dt>
                  <dd className="font-medium mt-0.5">{selectedRow.proposed_dimension}</dd>
                </div>
                <div>
                  <dt className="text-xs text-[var(--muted)]">
                    <EnZh en="Severity" zh="嚴重度" />
                  </dt>
                  <dd className="font-medium mt-0.5">{selectedRow.severity}</dd>
                </div>
                <div>
                  <dt className="text-xs text-[var(--muted)]">
                    <EnZh en="Proposed monitor" zh="提案指標" />
                  </dt>
                  <dd className="mt-0.5">
                    <MonitorCode id={selectedRow.proposed_monitor_id || "—"} />
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-[var(--muted)]">
                    <EnZh en="Proposed skill" zh="提案技能" />
                  </dt>
                  <dd className="font-mono text-xs mt-0.5 break-all">
                    {selectedRow.proposed_skill_code || "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-[var(--muted)]">
                    <EnZh en="Score" zh="分數" />
                  </dt>
                  <dd className="tabular-nums font-medium mt-0.5">
                    {selectedRow.score.toFixed(3)} · rel {(selectedRow.relative_score * 100).toFixed(0)}%
                  </dd>
                </div>
              </dl>
              {selectedRow.skill_code || selectedRow.monitor_id ? (
                <div className="rounded-lg bg-teal-50 border border-teal-200 p-3 text-sm">
                  <EnZh en="Promoted into daily monitoring:" zh="已晉升至每日監控：" />{" "}
                  <span className="font-mono">{selectedRow.skill_code}</span>
                  {" · "}
                  <MonitorCode id={selectedRow.monitor_id || ""} />
                </div>
              ) : null}
              <div>
                <button
                  type="button"
                  className="btn !min-h-9 text-xs"
                  onClick={() => setShowEvidence((v) => !v)}
                >
                  {showEvidence ? (
                    <EnZh en="Hide evidence JSON" zh="隱藏證據 JSON" />
                  ) : (
                    <EnZh en="Show evidence JSON" zh="顯示證據 JSON" />
                  )}
                </button>
                {showEvidence ? (
                  <pre className="mt-2 max-h-40 overflow-auto rounded-xl bg-slate-950 text-slate-100 text-[11px] p-3">
                    {JSON.stringify(JSON.parse(selectedRow.evidence_json || "{}"), null, 2)}
                  </pre>
                ) : null}
              </div>

              <div className="rounded-xl border border-teal-200 bg-teal-50/40 p-3 space-y-3">
                <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-teal-800">
                  <EnZh en="Step 2 · Analyse" zh="步驟 2 · 分析" />
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <label className="block text-xs font-semibold text-[var(--muted)]">
                    <EnZh en="Reviewer" zh="審查人" />
                    <input
                      className="mt-1 w-full rounded-md border border-[var(--line)] bg-white p-2 text-sm"
                      value={reviewer}
                      onChange={(e) => setReviewer(e.target.value)}
                      data-testid="discovery-reviewer"
                    />
                  </label>
                  <label className="block text-xs font-semibold text-[var(--muted)] sm:col-span-2">
                    <EnZh en="Question / reason" zh="問題／理由" />
                    <textarea
                      className="mt-1 w-full rounded-md border border-[var(--line)] bg-white p-2 text-sm"
                      rows={2}
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      data-testid="discovery-comment"
                    />
                  </label>
                </div>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={!!busy || !selectedRow}
                  onClick={analyseSelected}
                  data-testid="discovery-analyse"
                >
                  <EnZh en="Analyse selected" zh="分析所選" />
                </button>
              </div>

              {initial.roles.can_review ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3 space-y-2.5">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-900">
                    <EnZh en="Step 3 · RO review" zh="步驟 3 · RO 審查" />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="btn btn-primary"
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
                      className="btn text-[var(--muted)]"
                      disabled={!!busy || !selectedRow}
                      onClick={() => review("DISMISS")}
                      data-testid="discovery-dismiss"
                    >
                      <EnZh en="Dismiss" zh="駁回" />
                    </button>
                    <button
                      type="button"
                      className="btn border-rose-300 bg-rose-50 text-rose-950"
                      disabled={!!busy || !selectedRow}
                      onClick={() => review("APPROVE_FOR_MONITORING")}
                      data-testid="discovery-approve-monitoring"
                      title="Beyond notebook — promotes skill + monitor via maker≠checker"
                    >
                      <EnZh en="Approve for monitoring" zh="核准納入監控" />
                    </button>
                  </div>
                  <p className="text-xs text-[var(--muted)] leading-snug">
                    <EnZh
                      en="Ask for more info may refresh the AI suggestion card; that response is never treated as approval. A human owns every review decision."
                      zh="要求更多資訊可能刷新 AI 建議卡；該回覆絕不視為核准。每次審查決策皆由人類負責。"
                    />
                  </p>
                </div>
              ) : null}

              {msg ? (
                <p
                  className="text-sm font-medium text-teal-900 rounded-lg border border-teal-200 bg-teal-50 px-3 py-2"
                  data-testid="discovery-msg"
                >
                  {msg}
                </p>
              ) : null}
            </section>
          ) : (
            <section className="panel p-6 text-sm text-[var(--muted)]" data-testid="discovery-candidate-detail">
              <EnZh en="Select a candidate from the queue." zh="請從左側佇列選擇候選。" />
            </section>
          )}

          {suggestion ? <SuggestionCard suggestion={suggestion} locale={locale} /> : null}
        </div>
      </div>
    </div>
  );
}
