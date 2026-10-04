"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Badge, SeverityBadge, StatCard, StatusBadge } from "@/components/ui";
import { navLabel } from "@/lib/i18n";
import { useT } from "@/hooks/useUiLocale";

type Roles = {
  can_propose: boolean;
  can_approve: boolean;
  can_manage_skills: boolean;
  can_manage_rag: boolean;
  user_id: number;
  role_code: string;
};

type Overview = {
  kpis: {
    analyses_total: number;
    skill_match_rate: number;
    avg_confidence: number;
    needs_human: number;
    interventions_pending: number;
    human_agree_rate: number;
    feedback_correct_rate: number;
    feedback_total: number;
    pending_change_requests: number;
  };
  accuracy_history: Array<{
    snapshot_date: string;
    skill_match_rate: number;
    human_agree_rate: number;
    feedback_correct_rate: number;
    analyses_total: number;
  }>;
  recent_analyses: Array<{
    id: number;
    analysis_id: string;
    indicator_monitor_id: string;
    mode: string;
    confidence: number;
    status: string;
    needs_human: number;
    created_at: string;
    summary: string;
    latest_feedback: string | null;
  }>;
};

type ChangeReq = {
  id: number;
  request_id: string;
  entity_type: string;
  action: string;
  title: string;
  summary: string;
  payload_json: string;
  before_json: string | null;
  status: string;
  proposed_by: number;
  proposed_by_name: string;
  proposed_at: string;
  decided_by_name: string | null;
  decided_at: string | null;
  decision_note: string | null;
};

type Param = { key: string; value: string; description: string | null; updated_at: string };
type Skill = {
  id: number;
  code: string;
  name: string;
  description: string;
  status: string;
  owner_department: string;
  auto_execute: number;
  indicator_patterns_json: string;
};
type RagDoc = {
  id: number;
  doc_key: string;
  title: string;
  category: string;
  product_scope: string;
  status: string;
  version: number;
  excerpt: string;
};
type TrainingRun = {
  id: number;
  run_id: string;
  name: string;
  model_name: string;
  dataset_label: string;
  status: string;
  accuracy: number | null;
  precision_score: number | null;
  recall_score: number | null;
  f1_score: number | null;
  samples: number;
  notes: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_by_name: string | null;
};

const TABS = [
  { id: "overview", labelKey: "adm.overview" },
  { id: "params", labelKey: "adm.params" },
  { id: "changes", labelKey: "adm.changes" },
  { id: "skills", labelKey: "adm.skills" },
  { id: "rag", labelKey: "adm.rag" },
  { id: "training", labelKey: "adm.training" },
  { id: "history", labelKey: "adm.history" },
] as const;

function pct(n: number) {
  return `${Math.round(n * 1000) / 10}%`;
}

export function AiAdminConsole({
  initial,
}: {
  initial: {
    overview: Overview;
    params: Param[];
    changes: ChangeReq[];
    training: TrainingRun[];
    skills: Skill[];
    rag: RagDoc[];
    roles: Roles;
  };
}) {
  const router = useRouter();
  const { t, locale } = useT();
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("overview");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [note, setNote] = useState<Record<number, string>>({});
  const [paramDrafts, setParamDrafts] = useState<Record<string, string>>(() =>
    Object.fromEntries(initial.params.map((p) => [p.key, p.value]))
  );
  const [skillForm, setSkillForm] = useState({
    code: "SKILL-",
    name: "",
    description: "",
    indicator_patterns: "M2-",
    owner_department: "RISK_CONTROL",
    human_step: "flag_for_human_review",
  });
  const [ragForm, setRagForm] = useState({
    doc_key: "DOC-",
    title: "",
    category: "RISK_POLICY",
    product_scope: "CFD+CRYPTO",
    content: "",
    tags: "policy,ai",
  });
  const [trainForm, setTrainForm] = useState({
    name: "Weekly recalibration",
    model_name: "crmp-skill-matcher-v1",
    dataset_label: "rolling-30d-alarms",
    notes: "",
  });

  const pendingChanges = useMemo(
    () => initial.changes.filter((c) => c.status === "PENDING"),
    [initial.changes]
  );

  async function post(body: Record<string, unknown>) {
    setMsg(null);
    setErr(null);
    const res = await fetch("/api/ai-admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErr(data.error || `Failed (${res.status})`);
      return null;
    }
    setMsg(data.request_id ? `Submitted ${data.request_id}` : data.status || "OK");
    router.refresh();
    return data;
  }

  return (
    <div className="space-y-4">
      <div className="panel p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.12em] text-[var(--muted)]">{t("adm.governance")}</div>
          <p className="text-sm mt-1 max-w-3xl">
            {t("adm.govHint")}{" "}
            <Link className="underline" href="/admin/interventions">
              {navLabel("/admin/interventions", locale, "Human Intervention")}
            </Link>
            .
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <Badge className="bg-slate-100 text-slate-700 border-slate-200">{initial.roles.role_code}</Badge>
          {initial.roles.can_propose && (
            <Badge className="bg-amber-50 text-amber-900 border-amber-200">{t("adm.maker")}</Badge>
          )}
          {initial.roles.can_approve && (
            <Badge className="bg-teal-50 text-teal-900 border-teal-200">{t("adm.checker")}</Badge>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((tabBtn) => (
          <button
            key={tabBtn.id}
            type="button"
            className={`btn ${tab === tabBtn.id ? "btn-primary" : ""}`}
            onClick={() => setTab(tabBtn.id)}
          >
            {t(tabBtn.labelKey)}
            {tabBtn.id === "changes" && pendingChanges.length > 0 ? ` (${pendingChanges.length})` : ""}
          </button>
        ))}
      </div>

      {(msg || err) && (
        <div
          role="status"
          className={`text-sm rounded-lg px-3 py-2 border ${
            err
              ? "bg-rose-50 border-rose-200 text-rose-900"
              : "bg-teal-50 border-teal-200 text-teal-900"
          }`}
        >
          {err || msg}
        </div>
      )}

      {tab === "overview" && (
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
            <StatCard label={t("adm.analyses")} value={initial.overview.kpis.analyses_total} hint={t("adm.histRca")} />
            <StatCard
              label={t("adm.skillMatch")}
              value={pct(initial.overview.kpis.skill_match_rate)}
              hint={t("adm.skillMatchHint")}
            />
            <StatCard
              label={t("adm.humanAgree")}
              value={pct(initial.overview.kpis.human_agree_rate)}
              hint={t("adm.humanAgreeHint")}
            />
            <StatCard
              label={t("adm.feedbackAcc")}
              value={pct(initial.overview.kpis.feedback_correct_rate)}
              hint={t("adm.ratings", { n: initial.overview.kpis.feedback_total })}
            />
            <StatCard
              label={t("adm.avgConf")}
              value={(initial.overview.kpis.avg_confidence || 0).toFixed(2)}
            />
            <StatCard label={t("common.needsHuman")} value={initial.overview.kpis.needs_human} />
            <StatCard label={t("adm.pendingInt")} value={initial.overview.kpis.interventions_pending} />
            <StatCard
              label={t("adm.pendingCr")}
              value={initial.overview.kpis.pending_change_requests}
              hint={t("adm.mcQueue")}
            />
          </div>
          <div className="panel p-4">
            <h3 className="font-semibold">{t("adm.accTrend")}</h3>
            <div className="table-wrap mt-3">
              <table className="data">
                <thead>
                  <tr>
                    <th>{t("adm.date")}</th>
                    <th>{t("adm.skillMatch")}</th>
                    <th>{t("adm.humanAgree")}</th>
                    <th>{t("adm.feedbackAcc")}</th>
                    <th>{t("adm.analyses")}</th>
                  </tr>
                </thead>
                <tbody>
                  {initial.overview.accuracy_history.map((h) => (
                    <tr key={h.snapshot_date}>
                      <td>{h.snapshot_date}</td>
                      <td className="tabular-nums">{pct(h.skill_match_rate)}</td>
                      <td className="tabular-nums">{pct(h.human_agree_rate)}</td>
                      <td className="tabular-nums">{pct(h.feedback_correct_rate)}</td>
                      <td className="tabular-nums">{h.analyses_total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === "params" && (
        <div className="space-y-3">
          {initial.params.map((p) => (
            <div key={p.key} className="panel p-4 grid md:grid-cols-[1fr_220px_auto] gap-3 items-end">
              <div>
                <div className="font-semibold">{p.key}</div>
                <div className="text-sm text-[var(--muted)] mt-1">{p.description}</div>
                <div className="text-xs text-[var(--muted)] mt-1">{t("adm.live", { v: p.value })}</div>
              </div>
              <div>
                <label className="label">{t("adm.proposedVal")}</label>
                <input
                  className="input"
                  value={paramDrafts[p.key] ?? p.value}
                  onChange={(e) => setParamDrafts({ ...paramDrafts, [p.key]: e.target.value })}
                  disabled={!initial.roles.can_propose}
                />
              </div>
              <button
                type="button"
                className="btn btn-primary"
                disabled={!initial.roles.can_propose || paramDrafts[p.key] === p.value}
                onClick={() =>
                  void post({
                    action: "propose_param",
                    key: p.key,
                    value: paramDrafts[p.key],
                    summary: `Maker proposes ${p.key}=${paramDrafts[p.key]}`,
                  })
                }
              >
                {t("adm.proposeChange")}
              </button>
            </div>
          ))}
        </div>
      )}

      {tab === "changes" && (
        <div className="space-y-3">
          {initial.changes.map((c) => (
            <article key={c.id} className="panel p-4">
              <div className="flex flex-wrap gap-2 items-center">
                <StatusBadge value={c.status} />
                <Badge className="bg-slate-100 text-slate-700 border-slate-200">{c.entity_type}</Badge>
                <Badge className="bg-orange-50 text-orange-900 border-orange-200">{c.action}</Badge>
                <span className="text-xs text-[var(--muted)]">{c.request_id}</span>
              </div>
              <h3 className="mt-2 font-semibold text-lg">{c.title}</h3>
              <p className="text-sm text-slate-700 mt-1">{c.summary}</p>
              <div className="text-xs text-[var(--muted)] mt-2">
                Proposed by {c.proposed_by_name} at {c.proposed_at}
                {c.decided_by_name
                  ? ` · Decided by ${c.decided_by_name} at ${c.decided_at}${
                      c.decision_note ? ` — ${c.decision_note}` : ""
                    }`
                  : ""}
              </div>
              <pre className="mt-3 text-xs bg-slate-50 rounded-lg p-2 overflow-auto max-h-40">
                {JSON.stringify(JSON.parse(c.payload_json || "{}"), null, 2)}
              </pre>
              {c.status === "PENDING" && initial.roles.can_approve && (
                <div className="mt-3 grid md:grid-cols-[1fr_auto_auto] gap-2 items-end">
                  <div>
                    <label className="label">{t("adm.checkerNote")}</label>
                    <input
                      className="input"
                      value={note[c.id] || ""}
                      onChange={(e) => setNote({ ...note, [c.id]: e.target.value })}
                      placeholder={t("adm.checkerPh")}
                      disabled={c.proposed_by === initial.roles.user_id}
                    />
                  </div>
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={c.proposed_by === initial.roles.user_id}
                    title={
                      c.proposed_by === initial.roles.user_id
                        ? t("adm.cannotOwn")
                        : t("adm.approveApply")
                    }
                    onClick={() =>
                      void post({
                        action: "decide",
                        id: c.id,
                        decision: "APPROVED",
                        note: note[c.id] || "",
                      })
                    }
                  >
                    {t("adm.approveApply")}
                  </button>
                  <button
                    type="button"
                    className="btn"
                    disabled={c.proposed_by === initial.roles.user_id}
                    onClick={() =>
                      void post({
                        action: "decide",
                        id: c.id,
                        decision: "REJECTED",
                        note: note[c.id] || "",
                      })
                    }
                  >
                    {t("common.reject")}
                  </button>
                </div>
              )}
              {c.status === "PENDING" && c.proposed_by === initial.roles.user_id && (
                <div className="mt-3 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  {t("adm.waitChecker")}
                </div>
              )}
            </article>
          ))}
          {!initial.changes.length && (
            <div className="panel p-6 text-sm text-[var(--muted)]">{t("adm.noChanges")}</div>
          )}
        </div>
      )}

      {tab === "skills" && (
        <div className="space-y-4">
          {initial.roles.can_manage_skills || initial.roles.can_propose ? (
            <div className="panel p-4 space-y-3">
              <h3 className="font-semibold">{t("adm.proposeSkill")}</h3>
              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <label className="label">{t("adm.code")}</label>
                  <input
                    className="input"
                    value={skillForm.code}
                    onChange={(e) => setSkillForm({ ...skillForm, code: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">{t("common.name")}</label>
                  <input
                    className="input"
                    value={skillForm.name}
                    onChange={(e) => setSkillForm({ ...skillForm, name: e.target.value })}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="label">{t("src.description")}</label>
                  <input
                    className="input"
                    value={skillForm.description}
                    onChange={(e) => setSkillForm({ ...skillForm, description: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">{t("adm.indPatterns")}</label>
                  <input
                    className="input"
                    value={skillForm.indicator_patterns}
                    onChange={(e) => setSkillForm({ ...skillForm, indicator_patterns: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">{t("common.department")}</label>
                  <input
                    className="input"
                    value={skillForm.owner_department}
                    onChange={(e) => setSkillForm({ ...skillForm, owner_department: e.target.value })}
                  />
                </div>
              </div>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() =>
                  void post({
                    action: "propose_skill",
                    change_action: "CREATE",
                    title: `Create skill ${skillForm.code}`,
                    summary: skillForm.description || skillForm.name,
                    payload: {
                      code: skillForm.code,
                      name: skillForm.name || skillForm.code,
                      description: skillForm.description,
                      indicator_patterns: skillForm.indicator_patterns
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean),
                      conditions: { severity_in: ["WARN", "BREACH"] },
                      owner_department: skillForm.owner_department,
                      auto_execute: true,
                      steps: [
                        { action: "lark_notify", description: "Notify owning desk" },
                        {
                          action: skillForm.human_step,
                          description: "Human gate before corrective action",
                          requires_human: true,
                        },
                      ],
                    },
                  })
                }
              >
                {t("adm.submitSkill")}
              </button>
            </div>
          ) : null}

          <div className="space-y-2">
            {initial.skills.map((s) => (
              <article key={s.id} className="panel p-4 flex flex-wrap justify-between gap-3">
                <div>
                  <div className="text-xs text-[var(--muted)]">{s.code}</div>
                  <div className="font-semibold">{s.name}</div>
                  <div className="text-sm text-[var(--muted)] mt-1 max-w-3xl">{s.description}</div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {(JSON.parse(s.indicator_patterns_json || "[]") as string[]).map((p) => (
                      <Badge key={p} className="bg-orange-50 text-orange-900 border-orange-200">
                        {p}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <StatusBadge value={s.status} />
                  {(initial.roles.can_manage_skills || initial.roles.can_propose) && s.status === "ACTIVE" && (
                    <button
                      type="button"
                      className="btn"
                      onClick={() =>
                        void post({
                          action: "propose_skill",
                          change_action: "DISABLE",
                          title: `Disable ${s.code}`,
                          summary: `Retire skill ${s.name} from auto-match`,
                          payload: { id: s.id },
                        })
                      }
                    >
                      {t("adm.proposeDisable")}
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
          <p className="text-sm text-[var(--muted)]">
            Live skill catalog also at <Link className="underline" href="/admin/skills">/admin/skills</Link>.
          </p>
        </div>
      )}

      {tab === "rag" && (
        <div className="space-y-4">
          {(initial.roles.can_manage_rag || initial.roles.can_propose) && (
            <div className="panel p-4 space-y-3">
              <h3 className="font-semibold">{t("adm.proposeRag")}</h3>
              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <label className="label">{t("rag.docKey")}</label>
                  <input
                    className="input"
                    value={ragForm.doc_key}
                    onChange={(e) => setRagForm({ ...ragForm, doc_key: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">{t("common.title")}</label>
                  <input
                    className="input"
                    value={ragForm.title}
                    onChange={(e) => setRagForm({ ...ragForm, title: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">{t("common.category")}</label>
                  <input
                    className="input"
                    value={ragForm.category}
                    onChange={(e) => setRagForm({ ...ragForm, category: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">{t("adm.productScope")}</label>
                  <input
                    className="input"
                    value={ragForm.product_scope}
                    onChange={(e) => setRagForm({ ...ragForm, product_scope: e.target.value })}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="label">{t("common.content")}</label>
                  <textarea
                    className="input min-h-28"
                    value={ragForm.content}
                    onChange={(e) => setRagForm({ ...ragForm, content: e.target.value })}
                  />
                </div>
              </div>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() =>
                  void post({
                    action: "propose_rag",
                    change_action: "CREATE",
                    title: `Publish RAG ${ragForm.doc_key}`,
                    summary: ragForm.title,
                    payload: {
                      ...ragForm,
                      tags: ragForm.tags.split(",").map((t) => t.trim()).filter(Boolean),
                    },
                  })
                }
              >
                {t("adm.submitRag")}
              </button>
            </div>
          )}
          <div className="space-y-2">
            {initial.rag.map((d) => (
              <article key={d.id} className="panel p-4 flex flex-wrap justify-between gap-3">
                <div>
                  <div className="flex flex-wrap gap-2 items-center">
                    <StatusBadge value={d.status} />
                    <Badge className="bg-slate-100 text-slate-700 border-slate-200">{d.category}</Badge>
                    <Badge className="bg-orange-50 text-orange-900 border-orange-200">{d.product_scope}</Badge>
                  </div>
                  <div className="font-semibold mt-2">{d.title}</div>
                  <div className="text-xs text-[var(--muted)]">{d.doc_key} · v{d.version}</div>
                  <p className="text-sm mt-2 text-slate-700">{d.excerpt}…</p>
                </div>
                {(initial.roles.can_manage_rag || initial.roles.can_propose) && d.status === "ACTIVE" && (
                  <button
                    type="button"
                    className="btn"
                    onClick={() =>
                      void post({
                        action: "propose_rag",
                        change_action: "RETIRE",
                        title: `Retire RAG ${d.doc_key}`,
                        summary: d.title,
                        payload: { id: d.id },
                      })
                    }
                  >
                    {t("adm.proposeRetire")}
                  </button>
                )}
              </article>
            ))}
          </div>
          <p className="text-sm text-[var(--muted)]">
            Full RAG editor: <Link className="underline" href="/admin/rag">/admin/rag</Link>. Sensitive publish/retire
            should go through Maker/Checker here.
          </p>
        </div>
      )}

      {tab === "training" && (
        <div className="space-y-4">
          {initial.roles.can_propose && (
            <div className="panel p-4 space-y-3">
              <h3 className="font-semibold">{t("adm.queueTrain")}</h3>
              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <label className="label">{t("common.name")}</label>
                  <input
                    className="input"
                    value={trainForm.name}
                    onChange={(e) => setTrainForm({ ...trainForm, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">{t("adm.model")}</label>
                  <input
                    className="input"
                    value={trainForm.model_name}
                    onChange={(e) => setTrainForm({ ...trainForm, model_name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">{t("adm.dataset")}</label>
                  <input
                    className="input"
                    value={trainForm.dataset_label}
                    onChange={(e) => setTrainForm({ ...trainForm, dataset_label: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">{t("common.notes")}</label>
                  <input
                    className="input"
                    value={trainForm.notes}
                    onChange={(e) => setTrainForm({ ...trainForm, notes: e.target.value })}
                  />
                </div>
              </div>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => void post({ action: "queue_training", ...trainForm })}
              >
                {t("adm.proposeTrain")}
              </button>
            </div>
          )}
          <div className="panel table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Run</th>
                  <th>{t("adm.model")}</th>
                  <th>{t("adm.dataset")}</th>
                  <th>{t("common.status")}</th>
                  <th>{t("adm.accuracy")}</th>
                  <th>F1</th>
                  <th>{t("adm.samples")}</th>
                  <th>{t("common.owner")}</th>
                </tr>
              </thead>
              <tbody>
                {initial.training.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <div className="font-semibold">{t.name}</div>
                      <div className="text-xs text-[var(--muted)]">{t.run_id}</div>
                    </td>
                    <td>{t.model_name}</td>
                    <td className="text-sm">{t.dataset_label}</td>
                    <td>
                      <StatusBadge value={t.status} />
                    </td>
                    <td className="tabular-nums">{t.accuracy != null ? pct(t.accuracy) : "—"}</td>
                    <td className="tabular-nums">{t.f1_score != null ? pct(t.f1_score) : "—"}</td>
                    <td className="tabular-nums">{t.samples}</td>
                    <td className="text-sm">{t.created_by_name ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "history" && (
        <div className="space-y-3">
          {initial.overview.recent_analyses.map((a) => (
            <article key={a.id} className="panel p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap gap-2 items-center">
                    <Badge className="bg-teal-50 text-teal-900 border-teal-200">{a.mode}</Badge>
                    <StatusBadge value={a.status} />
                    {a.needs_human ? <SeverityBadge value="WARN" /> : null}
                    {a.latest_feedback && (
                      <Badge className="bg-slate-100 text-slate-700 border-slate-200">
                        feedback: {a.latest_feedback}
                      </Badge>
                    )}
                  </div>
                  <h3 className="mt-2 font-semibold">
                    {a.analysis_id} · {a.indicator_monitor_id}
                  </h3>
                  <div className="text-xs text-[var(--muted)]">
                    conf {(a.confidence ?? 0).toFixed(2)} · {a.created_at}
                  </div>
                  <p className="text-sm mt-2 text-slate-700">{a.summary}</p>
                </div>
                <div className="flex flex-col gap-2">
                  <Link className="btn" href={`/admin/ai-analyses/${a.id}`}>
                    {t("adm.openRecord")}
                  </Link>
                  <div className="flex flex-wrap gap-1">
                    {(["CORRECT", "INCORRECT", "PARTIAL"] as const).map((label) => (
                      <button
                        key={label}
                        type="button"
                        className="btn"
                        onClick={() =>
                          void post({
                            action: "feedback",
                            analysis_id: a.id,
                            label,
                            note: `Rated from AI Admin`,
                          })
                        }
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
