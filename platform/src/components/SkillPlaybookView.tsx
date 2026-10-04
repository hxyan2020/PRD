"use client";

import { useMemo } from "react";
import { AdminLink } from "@/components/AdminLink";
import { Badge, DeptBadge, StatusBadge } from "@/components/ui";
import { finalizeSkill, type SkillPlaybook } from "@/lib/ai/skill-playbook";
import type { SkillScenario } from "@/lib/ai/scenario-types";
import { useUiLocale } from "@/hooks/useUiLocale";
import { t, type UiLocale } from "@/lib/i18n";

function Section({
  k,
  locale,
  children,
}: {
  k: string;
  locale: UiLocale;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-[var(--line)] p-4">
      <div className="text-xs uppercase tracking-[0.12em] text-[var(--muted)]">{t(k, locale)}</div>
      <div className="mt-2">{children}</div>
    </section>
  );
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1.5 text-sm">
      {items.map((item) => (
        <li key={item} className="before:content-['•'] before:mr-1.5 before:text-teal-700">
          {item}
        </li>
      ))}
    </ul>
  );
}

export function SkillPlaybookView({
  scenario,
  status = "ACTIVE",
}: {
  scenario: SkillScenario;
  status?: string;
}) {
  const { locale } = useUiLocale();
  const s: SkillPlaybook = useMemo(() => finalizeSkill(scenario, locale), [scenario, locale]);
  const zh = locale === "zh-Hant";

  return (
    <article className="space-y-4">
      <div className="panel p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs text-[var(--muted)]">{s.code}</div>
            <h1 className="font-[family-name:var(--font-display)] text-2xl mt-0.5">{s.name}</h1>
            <p className="text-sm text-[var(--muted)] mt-2 max-w-3xl">{s.description}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <AdminLink href="/admin/skills" className="btn">
              {t("skill.back", locale)}
            </AdminLink>
            <AdminLink href="/admin/knowledge-tree" className="btn">
              {t("skill.tree", locale)}
            </AdminLink>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <DeptBadge code={s.owner_department} />
          <StatusBadge value={status} />
          <Badge className="bg-orange-50 text-orange-900 border-orange-200">{s.indicator.monitor_id}</Badge>
          <Badge className="bg-teal-50 text-teal-900 border-teal-200">
            {s.auto_execute === false ? t("skill.manual", locale) : t("skill.auto", locale)}
          </Badge>
          <Badge className="bg-slate-100 text-slate-700 border-slate-200">{s.owner_role}</Badge>
        </div>
        <p className="mt-3 text-xs text-[var(--muted)] max-w-3xl">
          {zh
            ? "寫作方式比照 SKILL.md：先寫何時用／何時不用，再寫前置檢查、步驟、證據、停止條件與成功標準。卡片是摘要；本頁才是完整劇本。"
            : "Written like a SKILL.md: when to use, when not to, prechecks, steps, evidence, stop conditions, and success criteria. The card is the summary; this page is the full playbook."}
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <Section k="skill.whenToUse" locale={locale}>
          <Bullets items={s.when_to_use} />
        </Section>
        <Section k="skill.whenNot" locale={locale}>
          <Bullets items={s.when_not_to_use} />
        </Section>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <Section k="skill.inputs" locale={locale}>
          <Bullets items={s.inputs} />
        </Section>
        <Section k="skill.outputs" locale={locale}>
          <Bullets items={s.outputs} />
        </Section>
      </div>

      <Section k="skill.prechecks" locale={locale}>
        <ol className="space-y-2">
          {s.prechecks.map((item, i) => (
            <li key={i} className="text-sm rounded-lg bg-slate-50 border border-[var(--line)] px-3 py-2">
              <span className="font-semibold tabular-nums">{i + 1}.</span> {item}
            </li>
          ))}
        </ol>
      </Section>

      <div className="grid md:grid-cols-3 gap-3 text-sm">
        <Section k="skill.indicator" locale={locale}>
          <div className="font-semibold">{s.indicator.name}</div>
          <div className="text-xs text-[var(--muted)]">
            {s.indicator.product} · {s.indicator.domain}
          </div>
          <div className="mt-2 tabular-nums">
            {zh ? "警告" : "warn"} {s.indicator.warn}
            {s.indicator.unit} / {zh ? "違規" : "breach"} {s.indicator.breach}
            {s.indicator.unit} ({s.indicator.comparator})
          </div>
          <p className="mt-2 text-[var(--muted)]">{s.indicator.why}</p>
        </Section>
        <Section k="skill.faults" locale={locale}>
          <Bullets items={s.fault_areas} />
        </Section>
        <Section k="skill.escalation" locale={locale}>
          <div className="text-xs text-[var(--muted)] mb-2">
            SLA {s.escalation.sla_minutes}
            {zh ? " 分鐘" : "m"}
          </div>
          <ol className="space-y-1 text-sm">
            {s.escalation.path.map((h, i) => (
              <li key={i}>
                <span className="font-medium">T+{h.after_minutes}m</span> · {h.team} · {h.action}
                <div className="text-xs text-[var(--muted)]">{h.channel}</div>
              </li>
            ))}
          </ol>
        </Section>
      </div>

      <Section k="skill.steps" locale={locale}>
        <ol className="space-y-2">
          {s.steps.map((st, i) => (
            <li key={i} className="text-sm rounded-lg bg-slate-50 border border-[var(--line)] px-3 py-2">
              <div className="font-semibold">
                {i + 1}. {st.action}
                {st.requires_human ? ` · ${t("skill.humanGate", locale)}` : ""}
                {st.bu ? ` · ${st.bu}` : ""}
              </div>
              <div className="text-[var(--muted)]">{st.description}</div>
            </li>
          ))}
        </ol>
      </Section>

      <Section k="skill.corrections" locale={locale}>
        <div className="space-y-2">
          {s.corrections.map((c, i) => (
            <div key={i} className="flex flex-wrap items-start gap-2 text-sm">
              <DeptBadge code={c.bu} />
              <div>
                <div className="font-semibold">
                  {c.action}
                  {c.requires_human ? ` · ${t("skill.humanGate", locale)}` : ""}
                </div>
                <div className="text-[var(--muted)]">{c.description}</div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <div className="grid md:grid-cols-2 gap-3">
        <Section k="skill.evidence" locale={locale}>
          <Bullets items={s.evidence_to_collect} />
        </Section>
        <Section k="skill.stop" locale={locale}>
          <Bullets items={s.stop_conditions} />
        </Section>
      </div>

      <Section k="skill.success" locale={locale}>
        <Bullets items={s.success_criteria} />
      </Section>

      <Section k="skill.related" locale={locale}>
        <div className="flex flex-wrap gap-1">
          {s.related_indicators.length ? (
            s.related_indicators.map((id) => (
              <Badge key={id} className="bg-orange-50 text-orange-900 border-orange-200">
                {id}
              </Badge>
            ))
          ) : (
            <span className="text-sm text-[var(--muted)]">{zh ? "無" : "None"}</span>
          )}
        </div>
      </Section>

      <Section k="skill.examples" locale={locale}>
        <div className="space-y-2">
          {s.past_cases.map((pc) => (
            <div key={pc.case_id} className="text-sm rounded-lg bg-slate-50 border border-[var(--line)] px-3 py-2">
              <div className="flex flex-wrap gap-2 items-center">
                <span className="font-semibold">{pc.case_id}</span>
                <Badge className="bg-teal-50 text-teal-900 border-teal-200">{pc.outcome}</Badge>
                <span className="text-xs text-[var(--muted)]">{pc.date}</span>
                {pc.alert_id && (
                  <AdminLink className="text-xs underline" href="/admin/alerts">
                    {pc.alert_id}
                  </AdminLink>
                )}
                {pc.analysis_href && (
                  <AdminLink className="text-xs underline" href={pc.analysis_href}>
                    {t("skill.aiAnalyses", locale)}
                  </AdminLink>
                )}
                <AdminLink className="text-xs underline" href="/admin/risk-log">
                  {t("skill.riskLog", locale)}
                </AdminLink>
              </div>
              <p className="text-[var(--muted)] mt-1">{pc.summary}</p>
            </div>
          ))}
        </div>
      </Section>
    </article>
  );
}
