"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge, DeptBadge, SeverityBadge, StatusBadge } from "@/components/ui";
import type { LinkedScenario, SkillScenario } from "@/lib/ai/scenario-types";

type SkillRow = {
  id: number;
  code: string;
  name: string;
  description: string;
  indicator_patterns_json: string;
  conditions_json: string;
  steps_json: string;
  auto_execute: number;
  owner_department: string;
  status: string;
  scenario_json: string;
};

type ChainRow = {
  id: number;
  code: string;
  name: string;
  description: string;
  product: string;
  domain: string;
  severity: string;
  sequence_json: string;
  causes_json: string;
  escalation_json: string;
  corrections_json: string;
  linked_skills_json: string;
  past_cases_json: string;
};

function parseScenario(raw: string, fallback: SkillRow): SkillScenario | null {
  try {
    const s = JSON.parse(raw || "{}") as SkillScenario;
    if (s?.indicator?.monitor_id) return s;
  } catch {
    /* ignore */
  }
  // Minimal fallback for skills without scenario_json yet
  const patterns = JSON.parse(fallback.indicator_patterns_json || "[]") as string[];
  return {
    code: fallback.code,
    name: fallback.name,
    description: fallback.description,
    indicator: {
      monitor_id: patterns[0] || "?",
      name: fallback.name,
      product: "CFD",
      domain: fallback.owner_department,
      warn: 0,
      breach: 0,
      unit: "",
      comparator: "gte",
      why: "See conditions JSON",
    },
    related_indicators: [],
    conditions: JSON.parse(fallback.conditions_json || "{}"),
    fault_areas: [],
    escalation: { sla_minutes: 30, path: [] },
    corrections: [],
    past_cases: [],
    steps: JSON.parse(fallback.steps_json || "[]"),
    owner_department: fallback.owner_department,
    auto_execute: !!fallback.auto_execute,
  };
}

export function SkillsScenariosBoard({
  skills,
  chains,
}: {
  skills: SkillRow[];
  chains: ChainRow[];
}) {
  const [tab, setTab] = useState<"skills" | "chains">("skills");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(skills[0]?.code ?? null);

  const skillViews = useMemo(
    () =>
      skills
        .map((s) => ({ row: s, scenario: parseScenario(s.scenario_json, s) }))
        .filter((x) => x.scenario) as Array<{ row: SkillRow; scenario: SkillScenario }>,
    [skills]
  );

  const filteredSkills = skillViews.filter(({ scenario: s }) => {
    if (!q) return true;
    const hay = `${s.code} ${s.name} ${s.indicator.monitor_id} ${s.indicator.name} ${s.fault_areas.join(" ")}`.toLowerCase();
    return hay.includes(q.toLowerCase());
  });

  const chainViews = useMemo(
    () =>
      chains.map((c) => ({
        row: c,
        data: {
          ...c,
          sequence: JSON.parse(c.sequence_json) as LinkedScenario["sequence"],
          causes: JSON.parse(c.causes_json) as string[],
          escalation_plan: JSON.parse(c.escalation_json) as LinkedScenario["escalation_plan"],
          corrections: JSON.parse(c.corrections_json) as LinkedScenario["corrections"],
          linked_skills: JSON.parse(c.linked_skills_json) as string[],
          past_cases: JSON.parse(c.past_cases_json) as LinkedScenario["past_cases"],
        },
      })),
    [chains]
  );

  const filteredChains = chainViews.filter(({ data }) => {
    if (!q) return true;
    const hay = `${data.code} ${data.name} ${data.domain} ${data.sequence.map((s) => s.monitor_id).join(" ")}`.toLowerCase();
    return hay.includes(q.toLowerCase());
  });

  return (
    <div className="space-y-4">
      <div className="panel p-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.12em] text-[var(--muted)]">Risk scenarios</div>
          <p className="text-sm mt-1 max-w-3xl">
            Each skill states indicator + thresholds (and why), fault areas, escalation path, BU correction actions,
            and links to past successful detections. Linked chains show multi-indicator timelines.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={`btn ${tab === "skills" ? "btn-primary" : ""}`} onClick={() => setTab("skills")}>
            Single-indicator skills ({skillViews.length})
          </button>
          <button type="button" className={`btn ${tab === "chains" ? "btn-primary" : ""}`} onClick={() => setTab("chains")}>
            Linked timelines ({chainViews.length})
          </button>
        </div>
      </div>

      <div className="panel p-3">
        <input
          className="input"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search indicator, fault area, scenario code…"
        />
      </div>

      {tab === "skills" && (
        <div className="space-y-3">
          {filteredSkills.map(({ row, scenario: s }) => {
            const expanded = open === s.code;
            return (
              <article key={row.id} className="panel p-4">
                <button
                  type="button"
                  className="w-full text-left"
                  onClick={() => setOpen(expanded ? null : s.code)}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-xs text-[var(--muted)]">{s.code}</div>
                      <h2 className="font-[family-name:var(--font-display)] text-xl">{s.name}</h2>
                      <p className="text-sm text-[var(--muted)] mt-1 max-w-3xl">{s.description}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <DeptBadge code={s.owner_department} />
                      <StatusBadge value={row.status} />
                      <Badge className="bg-orange-50 text-orange-900 border-orange-200">
                        {s.indicator.monitor_id}
                      </Badge>
                      <Badge className="bg-teal-50 text-teal-900 border-teal-200">
                        {s.auto_execute === false ? "manual" : "auto-execute"}
                      </Badge>
                    </div>
                  </div>
                </button>

                <div className="mt-3 grid md:grid-cols-3 gap-3 text-sm">
                  <div className="rounded-xl border border-[var(--line)] p-3">
                    <div className="text-xs uppercase tracking-wide text-[var(--muted)]">Indicator & thresholds</div>
                    <div className="mt-1 font-semibold">{s.indicator.name}</div>
                    <div className="text-xs text-[var(--muted)]">
                      {s.indicator.product} · {s.indicator.domain}
                    </div>
                    <div className="mt-2 tabular-nums">
                      warn {s.indicator.warn}
                      {s.indicator.unit} / breach {s.indicator.breach}
                      {s.indicator.unit} ({s.indicator.comparator})
                    </div>
                    <p className="mt-2 text-[var(--muted)]">{s.indicator.why}</p>
                  </div>
                  <div className="rounded-xl border border-[var(--line)] p-3">
                    <div className="text-xs uppercase tracking-wide text-[var(--muted)]">Fault areas</div>
                    <ul className="mt-2 space-y-1">
                      {s.fault_areas.map((f) => (
                        <li key={f} className="before:content-['•'] before:mr-1.5 before:text-teal-700">
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-xl border border-[var(--line)] p-3">
                    <div className="text-xs uppercase tracking-wide text-[var(--muted)]">
                      Escalation (SLA {s.escalation.sla_minutes}m)
                    </div>
                    <ol className="mt-2 space-y-1">
                      {s.escalation.path.map((h, i) => (
                        <li key={i}>
                          <span className="font-medium">T+{h.after_minutes}m</span> · {h.team} · {h.action}
                          <div className="text-xs text-[var(--muted)]">{h.channel}</div>
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>

                {expanded && (
                  <div className="mt-3 space-y-3">
                    <div className="rounded-xl border border-[var(--line)] p-3">
                      <div className="text-xs uppercase tracking-wide text-[var(--muted)]">
                        Correction actions by BU
                      </div>
                      <div className="mt-2 space-y-2">
                        {s.corrections.map((c, i) => (
                          <div key={i} className="flex flex-wrap items-start gap-2 text-sm">
                            <DeptBadge code={c.bu} />
                            <div>
                              <div className="font-semibold">
                                {c.action}
                                {c.requires_human ? " · human gate" : ""}
                              </div>
                              <div className="text-[var(--muted)]">{c.description}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-xl border border-[var(--line)] p-3">
                      <div className="text-xs uppercase tracking-wide text-[var(--muted)]">Playbook steps</div>
                      <ol className="mt-2 space-y-2">
                        {s.steps.map((st, i) => (
                          <li key={i} className="text-sm rounded-lg bg-slate-50 border border-[var(--line)] px-3 py-2">
                            <div className="font-semibold">
                              {i + 1}. {st.action}
                              {st.requires_human ? " · human gate" : ""}
                              {st.bu ? ` · ${st.bu}` : ""}
                            </div>
                            <div className="text-[var(--muted)]">{st.description}</div>
                          </li>
                        ))}
                      </ol>
                    </div>

                    <div className="rounded-xl border border-[var(--line)] p-3">
                      <div className="text-xs uppercase tracking-wide text-[var(--muted)]">
                        Related indicators
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {s.related_indicators.length ? (
                          s.related_indicators.map((id) => (
                            <Badge key={id} className="bg-orange-50 text-orange-900 border-orange-200">
                              {id}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-sm text-[var(--muted)]">None</span>
                        )}
                      </div>
                    </div>

                    <div className="rounded-xl border border-[var(--line)] p-3">
                      <div className="text-xs uppercase tracking-wide text-[var(--muted)]">
                        Past successfully detected cases
                      </div>
                      <div className="mt-2 space-y-2">
                        {s.past_cases.map((pc) => (
                          <div key={pc.case_id} className="text-sm rounded-lg bg-slate-50 border border-[var(--line)] px-3 py-2">
                            <div className="flex flex-wrap gap-2 items-center">
                              <span className="font-semibold">{pc.case_id}</span>
                              <Badge className="bg-teal-50 text-teal-900 border-teal-200">{pc.outcome}</Badge>
                              <span className="text-xs text-[var(--muted)]">{pc.date}</span>
                              {pc.alert_id && (
                                <Link className="text-xs underline" href="/admin/alerts">
                                  {pc.alert_id}
                                </Link>
                              )}
                              {pc.analysis_href && (
                                <Link className="text-xs underline" href={pc.analysis_href}>
                                  AI analyses
                                </Link>
                              )}
                              <Link className="text-xs underline" href="/admin/risk-log">
                                Risk log
                              </Link>
                            </div>
                            <p className="text-[var(--muted)] mt-1">{pc.summary}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      {tab === "chains" && (
        <div className="space-y-3">
          {filteredChains.map(({ data }) => (
            <article key={data.code} className="panel p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-xs text-[var(--muted)]">{data.code}</div>
                  <h2 className="font-[family-name:var(--font-display)] text-xl">{data.name}</h2>
                  <p className="text-sm text-[var(--muted)] mt-1 max-w-3xl">{data.description}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <SeverityBadge value={data.severity} />
                  <Badge className="bg-orange-50 text-orange-900 border-orange-200">{data.product}</Badge>
                  <Badge className="bg-slate-100 text-slate-700 border-slate-200">{data.domain}</Badge>
                </div>
              </div>

              <div className="mt-4">
                <div className="text-xs uppercase tracking-wide text-[var(--muted)]">Indicator timeline</div>
                <div className="mt-2 relative pl-4 border-l-2 border-teal-200 space-y-3">
                  {data.sequence.map((ev, i) => (
                    <div key={i} className="relative">
                      <span className="absolute -left-[21px] top-1 h-3 w-3 rounded-full bg-teal-600" />
                      <div className="text-sm">
                        <span className="font-semibold tabular-nums">T+{ev.t_minutes}m</span>{" "}
                        <Badge className="bg-orange-50 text-orange-900 border-orange-200">{ev.monitor_id}</Badge>{" "}
                        <SeverityBadge value={ev.severity} />
                        <div className="text-[var(--muted)] mt-0.5">{ev.signal}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 grid md:grid-cols-3 gap-3 text-sm">
                <div className="rounded-xl border border-[var(--line)] p-3">
                  <div className="text-xs uppercase tracking-wide text-[var(--muted)]">Likely causes</div>
                  <ul className="mt-2 space-y-1">
                    {data.causes.map((c) => (
                      <li key={c} className="before:content-['•'] before:mr-1.5 before:text-teal-700">
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-xl border border-[var(--line)] p-3">
                  <div className="text-xs uppercase tracking-wide text-[var(--muted)]">Escalation plan</div>
                  <ol className="mt-2 space-y-1">
                    {data.escalation_plan.map((h, i) => (
                      <li key={i}>
                        <span className="font-medium">T+{h.after_minutes}m</span> · {h.team}
                        <div className="text-xs text-[var(--muted)]">{h.action}</div>
                      </li>
                    ))}
                  </ol>
                </div>
                <div className="rounded-xl border border-[var(--line)] p-3">
                  <div className="text-xs uppercase tracking-wide text-[var(--muted)]">Corrections by BU</div>
                  <div className="mt-2 space-y-2">
                    {data.corrections.map((c, i) => (
                      <div key={i}>
                        <DeptBadge code={c.bu} />{" "}
                        <span className="font-semibold">{c.action}</span>
                        <div className="text-[var(--muted)]">{c.description}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2 items-center">
                <span className="text-xs uppercase tracking-wide text-[var(--muted)]">Linked skills</span>
                {data.linked_skills.map((code) => (
                  <button
                    key={code}
                    type="button"
                    className="btn"
                    onClick={() => {
                      setTab("skills");
                      setOpen(code);
                      setQ(code);
                    }}
                  >
                    {code}
                  </button>
                ))}
              </div>

              <div className="mt-3 rounded-xl border border-[var(--line)] p-3">
                <div className="text-xs uppercase tracking-wide text-[var(--muted)]">Past cases</div>
                <div className="mt-2 space-y-2">
                  {data.past_cases.map((pc) => (
                    <div key={pc.case_id} className="text-sm">
                      <span className="font-semibold">{pc.case_id}</span> · {pc.date} ·{" "}
                      <Badge className="bg-teal-50 text-teal-900 border-teal-200">{pc.outcome}</Badge>
                      {pc.alert_id && (
                        <>
                          {" "}
                          · <Link className="underline" href="/admin/alerts">{pc.alert_id}</Link>
                        </>
                      )}
                      <div className="text-[var(--muted)]">{pc.summary}</div>
                    </div>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
