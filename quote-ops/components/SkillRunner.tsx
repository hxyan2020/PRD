"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AgentDocBar } from "@/components/AgentDocBar";
import { KbNodeAuditBySlug } from "@/components/KbNodeAuditBySlug";
import { SeverityBadge } from "@/components/ClassBadge";
import { getRisk } from "@/lib/data/risks";
import type { Skill } from "@/lib/types";
import { useI18n } from "@/lib/i18n/context";

export function SkillRunner({ skill }: { skill: Skill }) {
  const { locale, t } = useI18n();
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [creating, setCreating] = useState(false);
  const [caseMsg, setCaseMsg] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    void fetch("/api/me")
      .then((r) => r.json())
      .then((d: { isAdmin?: boolean }) => setIsAdmin(!!d.isAdmin))
      .catch(() => undefined);
  }, []);

  const progress = useMemo(() => {
    const total = skill.steps.length;
    const n = skill.steps.filter((s) => done[s.id]).length;
    return { n, total, pct: total ? Math.round((n / total) * 100) : 0 };
  }, [done, skill.steps]);

  async function openCase() {
    setCreating(true);
    setCaseMsg(null);
    try {
      const res = await fetch("/api/cases", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: locale === "zh-CN" ? skill.titleZh : skill.title,
          severity: skill.severity,
          skillId: skill.id,
          riskIds: skill.relatedRiskIds,
          notes: t("从 Skill 清单创建", "Opened from skill checklist"),
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { id: string };
      setCaseMsg(t(`已创建案件 ${data.id}`, `Created case ${data.id}`));
    } catch (e) {
      setCaseMsg(e instanceof Error ? e.message : "failed");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-6 animate-rise">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/skills" className="text-xs text-sea hover:underline">
            ← {t("返回技能库", "Back to skills")}
          </Link>
          <h1 className="mt-2 font-display text-3xl text-ink">
            {locale === "zh-CN" ? skill.titleZh : skill.title}
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-mist">
            {locale === "zh-CN" ? skill.summaryZh : skill.summary}
          </p>
        </div>
        <SeverityBadge s={skill.severity} />
      </div>

      <div className="rounded-xl border border-line bg-white/80 p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-mist">
            {t("进度", "Progress")} {progress.n}/{progress.total}
          </span>
          <span className="font-mono text-sea">{progress.pct}%</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-line/60">
          <div
            className="h-full rounded-full bg-sea transition-all duration-500"
            style={{ width: `${progress.pct}%` }}
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {isAdmin ? (
            <button
              type="button"
              onClick={() => void openCase()}
              disabled={creating}
              className="rounded-md bg-ink px-3 py-1.5 text-xs text-paper disabled:opacity-60"
            >
              {creating ? t("创建中…", "Creating…") : t("据此创建排查案件", "Open investigation case")}
            </button>
          ) : (
            <span className="rounded-md border border-line bg-paper px-3 py-1.5 text-xs text-mist">
              {t("案件创建仅管理员", "Case creation is admin-only")}
            </span>
          )}
          {caseMsg && <span className="text-xs text-mist">{caseMsg}</span>}
        </div>
      </div>

      <AgentDocBar
        nodeKey={skill.slug}
        getMarkdown={async () => {
          try {
            const res = await fetch(
              `/api/kb/${encodeURIComponent(skill.slug)}?markdown=1&locale=${locale === "en" ? "en" : "zh-CN"}`,
            );
            if (res.ok) {
              const data = (await res.json()) as { markdown: string };
              return data.markdown;
            }
          } catch {
            /* fall through */
          }
          const title = locale === "zh-CN" ? skill.titleZh : skill.title;
          const summary = locale === "zh-CN" ? skill.summaryZh : skill.summary;
          const steps = skill.steps
            .map((s, i) => {
              const st = locale === "zh-CN" ? s.titleZh : s.title;
              const detail = locale === "zh-CN" ? s.detailZh : s.detail;
              const hint =
                locale === "zh-CN" ? s.queryHintZh ?? s.queryHint : s.queryHint;
              return [
                `### ${i + 1}. ${st}`,
                "",
                detail,
                hint ? `\n\`\`\`\n${hint}\n\`\`\`` : "",
                "",
              ].join("\n");
            })
            .join("\n");
          return [
            `# ${title}`,
            "",
            `> ${summary}`,
            "",
            `- slug: \`${skill.slug}\``,
            `- severity: ${skill.severity}`,
            "",
            "## Steps",
            "",
            steps,
          ].join("\n");
        }}
        label={`agent.md · ${skill.slug}`}
        isAdmin={isAdmin}
      />

      <KbNodeAuditBySlug slug={skill.slug} />

      <ol className="space-y-3">
        {skill.steps.map((step, idx) => {
          const on = !!done[step.id];
          return (
            <li
              key={step.id}
              className={`rounded-xl border p-4 transition ${
                on ? "border-ok/40 bg-emerald-50/50" : "border-line bg-white/85"
              }`}
            >
              <label className="flex cursor-pointer gap-3">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={on}
                  onChange={(e) => setDone((d) => ({ ...d, [step.id]: e.target.checked }))}
                />
                <div className="flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-xs text-mist">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <h2 className="font-semibold text-ink">
                      {locale === "zh-CN" ? step.titleZh : step.title}
                    </h2>
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-ink-2">
                    {locale === "zh-CN" ? step.detailZh : step.detail}
                  </p>
                  {(step.queryHint || step.queryHintZh) && (
                    <pre className="mt-3 overflow-x-auto rounded-lg bg-ink px-3 py-2 font-mono text-[11px] leading-relaxed text-sea-soft">
                      {locale === "zh-CN"
                        ? step.queryHintZh ?? step.queryHint
                        : step.queryHint}
                    </pre>
                  )}
                </div>
              </label>
            </li>
          );
        })}
      </ol>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-line bg-white/80 p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-mist">
            {t("需要证据", "Evidence required")}
          </h3>
          <ul className="mt-2 space-y-1 text-sm text-ink-2">
            {(locale === "zh-CN" ? skill.evidenceZh : skill.evidence).map((e) => (
              <li key={e}>· {e}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-line bg-white/80 p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-mist">
            {t("相关风险场景", "Related risks")}
          </h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {skill.relatedRiskIds.map((id) => {
              const r = getRisk(id);
              if (!r) return null;
              return (
                <Link
                  key={id}
                  href={`/risks/${id}`}
                  className="rounded-md border border-line bg-paper px-2 py-1 text-xs hover:border-sea/40"
                >
                  #{id} {locale === "zh-CN" ? r.titleZh : r.title}
                </Link>
              );
            })}
          </div>
          <h3 className="mt-4 text-xs font-semibold uppercase tracking-wide text-mist">
            {t("触发条件", "Triggers")}
          </h3>
          <ul className="mt-2 space-y-1 text-sm text-ink-2">
            {(locale === "zh-CN" ? skill.triggersZh : skill.triggers).map((e) => (
              <li key={e}>· {e}</li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
