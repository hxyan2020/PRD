"use client";

import Link from "next/link";
import { ClassBadge, FreqBadge, SeverityBadge } from "@/components/ClassBadge";
import { SKILLS } from "@/lib/data/skills";
import type { RiskScenario } from "@/lib/types";
import { useI18n } from "@/lib/i18n/context";

export function RiskDetail({ risk }: { risk: RiskScenario }) {
  const { locale, t } = useI18n();
  const relatedSkills = SKILLS.filter((s) => s.relatedRiskIds.includes(risk.id));

  return (
    <article className="space-y-5 animate-rise">
      <Link href="/risks" className="text-xs text-sea hover:underline">
        ← {t("返回目录", "Back to catalog")}
      </Link>
      <header>
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-sm text-mist">#{risk.id}</span>
          {risk.classes.map((c) => (
            <ClassBadge key={c} c={c} />
          ))}
          <FreqBadge f={risk.frequency} />
          <SeverityBadge s={risk.severity} />
        </div>
        <h1 className="mt-2 font-display text-3xl text-ink">
          {locale === "zh-CN" ? risk.titleZh : risk.title}
        </h1>
        <p className="mt-2 text-sm text-ink-2">
          {locale === "zh-CN" ? risk.howItWorksZh : risk.howItWorks}
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <Panel
          title={t("如何检测", "How to detect")}
          items={locale === "zh-CN" ? risk.detectZh : risk.detect}
        />
        <Panel
          title={t("预防或管理", "Prevent / manage")}
          items={locale === "zh-CN" ? risk.preventZh : risk.prevent}
        />
      </div>

      <div className="rounded-xl border border-line bg-white/85 p-4">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-mist">
          {t("负责部门", "Owners")}
        </h2>
        <div className="mt-2 flex flex-wrap gap-2">
          {risk.owners.map((o) => (
            <span key={o} className="rounded border border-line bg-paper px-2 py-1 text-xs">
              {o}
            </span>
          ))}
        </div>
      </div>

      {relatedSkills.length > 0 && (
        <div className="rounded-xl border border-sea/30 bg-sea-soft/30 p-4">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-sea">
            {t("相关 Skills", "Related skills")}
          </h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {relatedSkills.map((s) => (
              <Link
                key={s.id}
                href={`/skills/${s.slug}`}
                className="rounded-md border border-sea/30 bg-white px-3 py-1.5 text-xs text-ink hover:bg-sea-soft"
              >
                {locale === "zh-CN" ? s.titleZh : s.title}
              </Link>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}

function Panel({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-xl border border-line bg-white/85 p-4">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-mist">{title}</h2>
      <ul className="mt-2 space-y-1.5 text-sm text-ink-2">
        {items.map((i) => (
          <li key={i} className="flex gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-copper" />
            {i}
          </li>
        ))}
      </ul>
    </div>
  );
}
