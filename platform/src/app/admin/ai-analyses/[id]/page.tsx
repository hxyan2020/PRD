import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { getAnalysisBundle } from "@/lib/ai/analyze";
import { getDb } from "@/lib/db";
import { isStaticExport } from "@/lib/static-export";
import { AiChallengePanel } from "@/components/AiChallengePanel";
import { PageHeader, Badge, SeverityBadge, StatusBadge } from "@/components/ui";
import { T } from "@/components/T";

export async function generateStaticParams() {
  try {
    const rows = getDb().prepare(`SELECT id FROM ai_analyses`).all() as Array<{ id: number }>;
    if (rows.length) return rows.map((row) => ({ id: String(row.id) }));
  } catch (error) {
    console.warn("[static-export] ai-analyses params", error);
  }
  return [{ id: "0" }];
}

export default async function AiAnalysisDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!isStaticExport() && (!user || !hasPermission(user.role_code, "ai.read"))) redirect("/admin");
  const { id } = await params;
  const bundle = getAnalysisBundle(Number(id));
  if (!bundle.analysis) {
    if (isStaticExport()) {
      return (
        <div>
          <PageHeader
            title={<T k="ai.snapshot" />}
            subtitle={<T k="ai.snapshotSub" />}
            actions={
              <Link className="btn" href="/admin/ai-analyses">
                <T k="common.back" />
              </Link>
            }
          />
        </div>
      );
    }
    redirect("/admin/ai-analyses");
  }

  const analysis = bundle.analysis as {
    id: number;
    analysis_id: string;
    mode: string;
    confidence: number;
    summary: string;
    explanations_json: string;
    actions_taken_json: string;
    status: string;
    needs_human: number;
    indicator_monitor_id: string;
    created_at: string;
    skill_id: number | null;
    challenged?: number;
    challenge_verdict?: string | null;
  };
  const challenge = bundle.challenge as {
    challenge_id: string;
    model_name: string;
    verdict: string;
    confidence: number;
    summary: string;
    critique_json: string;
    improvements_json: string;
    alternatives_json: string;
    alert_severity: string | null;
    created_at: string;
  } | null;

  const explanations = JSON.parse(analysis.explanations_json) as Array<Record<string, unknown>>;
  const actions = JSON.parse(analysis.actions_taken_json) as Array<Record<string, unknown>>;
  const evidence = bundle.evidence as Array<{
    id: number;
    evidence_type: string;
    ref_id: string | null;
    title: string;
    excerpt: string;
    url: string | null;
    score: number;
  }>;
  const skillRuns = bundle.skillRuns as Array<{
    id: number;
    step_index: number;
    action_code: string;
    status: string;
    detail_json: string;
  }>;

  return (
    <div>
      <PageHeader
        title={analysis.analysis_id}
        subtitle={analysis.summary}
        actions={
          <Link className="btn" href="/admin/ai-analyses">
            <T k="common.back" />
          </Link>
        }
      />

      <div className="flex flex-wrap gap-2 mb-4">
        <Badge
          className={
            analysis.mode === "SKILL_MATCH"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-amber-50 text-amber-900 border-amber-200"
          }
        >
          {analysis.mode}
        </Badge>
        <StatusBadge value={analysis.status} />
        <Badge className="bg-slate-100 text-slate-700 border-slate-200">
          <T k="common.confidence" /> {(analysis.confidence * 100).toFixed(0)}%
        </Badge>
        <Badge className="bg-orange-50 text-orange-900 border-orange-200">{analysis.indicator_monitor_id}</Badge>
        {analysis.needs_human ? <SeverityBadge value="WARN" /> : null}
        {analysis.challenged ? (
          <Badge
            className={
              analysis.challenge_verdict === "AGREE"
                ? "bg-emerald-50 text-emerald-900 border-emerald-200"
                : analysis.challenge_verdict === "DISAGREE"
                  ? "bg-rose-50 text-rose-900 border-rose-200"
                  : "bg-amber-50 text-amber-900 border-amber-200"
            }
          >
            <T k="ai.challenged" vars={{ verdict: analysis.challenge_verdict || "challenged" }} />
          </Badge>
        ) : null}
      </div>

      <div className="mb-4">
        <AiChallengePanel challenge={challenge} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 sm:gap-4">
        <section className="panel p-3 sm:p-4 min-w-0">
          <h2 className="font-[family-name:var(--font-display)] text-lg"><T k="ai.explanations" /></h2>
          <div className="mt-3 space-y-3">
            {explanations.map((e, i) => (
              <div key={i} className="rounded-xl border border-[var(--line)] p-3">
                <div className="font-semibold">{String(e.hypothesis)}</div>
                <div className="text-xs text-[var(--muted)] mt-1">
                  <T k="ai.likelihood" /> {String(e.likelihood)} · <T k="common.confidence" /> {Number(e.confidence || 0).toFixed(2)}
                </div>
                <p className="text-sm mt-2 text-slate-700 whitespace-pre-wrap">{String(e.rationale)}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="panel p-4">
          <h2 className="font-[family-name:var(--font-display)] text-lg"><T k="ai.evidenceVault" /></h2>
          <div className="mt-3 space-y-3">
            {evidence.map((ev) => (
              <div key={ev.id} className="rounded-xl border border-[var(--line)] p-3">
                <div className="flex flex-wrap gap-2 items-center">
                  <Badge className="bg-teal-50 text-teal-900 border-teal-200">{ev.evidence_type}</Badge>
                  <span className="font-semibold text-sm">{ev.title}</span>
                  <span className="text-xs text-[var(--muted)]"><T k="common.score" /> {ev.score.toFixed(2)}</span>
                </div>
                <p className="text-sm mt-2 text-slate-700">{ev.excerpt}</p>
                <div className="text-xs text-[var(--muted)] mt-1">
                  {ev.ref_id}
                  {ev.url ? (
                    <>
                      {" · "}
                      <a className="text-teal-800" href={ev.url} target="_blank" rel="noreferrer">
                        {ev.url}
                      </a>
                    </>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 sm:gap-4 mt-4">
        <section className="panel p-3 sm:p-4 min-w-0">
          <h2 className="font-[family-name:var(--font-display)] text-lg"><T k="ai.actionsTaken" /></h2>
          <ul className="mt-3 space-y-2">
            {actions.map((a, i) => (
              <li key={i} className="rounded-lg border border-[var(--line)] px-3 py-2 text-sm">
                <div className="font-semibold">
                  {String(a.action || a.action_code || `step ${i + 1}`)} · {String(a.status)}
                </div>
                <div className="text-[var(--muted)]">{String(a.description || "")}</div>
              </li>
            ))}
          </ul>
        </section>

        <section className="panel p-4">
          <h2 className="font-[family-name:var(--font-display)] text-lg"><T k="ai.skillRunLog" /></h2>
          {skillRuns.length ? (
            <ol className="mt-3 space-y-2">
              {skillRuns.map((r) => (
                <li key={r.id} className="rounded-lg border border-[var(--line)] px-3 py-2 text-sm">
                  <div className="font-semibold">
                    #{r.step_index + 1} {r.action_code} · {r.status}
                  </div>
                  <pre className="text-xs mt-1 text-[var(--muted)] whitespace-pre-wrap">{r.detail_json}</pre>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-sm text-[var(--muted)] mt-3"><T k="ai.noSkillSteps" /></p>
          )}
        </section>
      </div>
    </div>
  );
}
