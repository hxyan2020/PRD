import { Badge, SeverityBadge } from "@/components/ui";

type Challenge = {
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
};

export function AiChallengePanel({ challenge }: { challenge: Challenge | null | undefined }) {
  if (!challenge) {
    return (
      <section className="panel p-4">
        <h2 className="font-[family-name:var(--font-display)] text-lg">Second AI challenger</h2>
        <p className="text-sm text-[var(--muted)] mt-2">
          Not run — challenger activates for alerts at or above{" "}
          <code className="text-xs">ai.second_opinion_severity</code> (default BREACH).
        </p>
      </section>
    );
  }

  const critiques = JSON.parse(challenge.critique_json || "[]") as Array<{
    point: string;
    severity: string;
    related_hypothesis?: string;
  }>;
  const improvements = JSON.parse(challenge.improvements_json || "[]") as Array<{
    area: string;
    recommendation: string;
    priority: string;
  }>;
  const alternatives = JSON.parse(challenge.alternatives_json || "[]") as Array<{
    hypothesis: string;
    rationale: string;
    confidence: number;
  }>;

  const verdictClass =
    challenge.verdict === "AGREE"
      ? "bg-emerald-50 text-emerald-900 border-emerald-200"
      : challenge.verdict === "PARTIAL"
        ? "bg-amber-50 text-amber-900 border-amber-200"
        : "bg-rose-50 text-rose-900 border-rose-200";

  return (
    <section className="panel p-4 border-teal-200">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="text-xs uppercase tracking-[0.12em] text-[var(--muted)]">Independent model</div>
          <h2 className="font-[family-name:var(--font-display)] text-lg">Second AI challenger</h2>
          <p className="text-sm text-[var(--muted)] mt-1 max-w-3xl">{challenge.summary}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge className={verdictClass}>{challenge.verdict}</Badge>
          <Badge className="bg-slate-100 text-slate-700 border-slate-200">{challenge.model_name}</Badge>
          <Badge className="bg-orange-50 text-orange-900 border-orange-200">{challenge.challenge_id}</Badge>
          {challenge.alert_severity ? <SeverityBadge value={challenge.alert_severity} /> : null}
        </div>
      </div>

      <div className="mt-4 grid md:grid-cols-3 gap-3 text-sm">
        <div className="rounded-xl border border-[var(--line)] p-3">
          <div className="text-xs uppercase text-[var(--muted)]">Critique of primary RCA</div>
          <ul className="mt-2 space-y-2">
            {critiques.map((c, i) => (
              <li key={i}>
                <SeverityBadge value={c.severity === "INFO" ? "INFO" : c.severity} />{" "}
                <span>{c.point}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-[var(--line)] p-3">
          <div className="text-xs uppercase text-[var(--muted)]">Recommended improvements</div>
          <ul className="mt-2 space-y-2">
            {improvements.map((imp, i) => (
              <li key={i}>
                <Badge
                  className={
                    imp.priority === "HIGH"
                      ? "bg-rose-50 text-rose-900 border-rose-200"
                      : "bg-slate-100 text-slate-700 border-slate-200"
                  }
                >
                  {imp.priority} · {imp.area}
                </Badge>
                <div className="mt-1">{imp.recommendation}</div>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-[var(--line)] p-3">
          <div className="text-xs uppercase text-[var(--muted)]">Alternative hypotheses</div>
          {alternatives.length ? (
            <ul className="mt-2 space-y-2">
              {alternatives.map((a, i) => (
                <li key={i}>
                  <div className="font-semibold">{a.hypothesis}</div>
                  <div className="text-xs text-[var(--muted)]">confidence {a.confidence.toFixed(2)}</div>
                  <div className="mt-1 text-[var(--muted)]">{a.rationale}</div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[var(--muted)] mt-2">None — primary narrative accepted.</p>
          )}
        </div>
      </div>
      <div className="text-xs text-[var(--muted)] mt-3">
        Challenger confidence {(challenge.confidence * 100).toFixed(0)}% · {challenge.created_at}
      </div>
    </section>
  );
}
