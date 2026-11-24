"use client";

import Link from "next/link";
import { SeverityBadge } from "@/components/ClassBadge";
import { skillsForProduct } from "@/lib/data/skills";
import { useI18n } from "@/lib/i18n/context";
import { useProduct } from "@/lib/product/context";

export function SkillsBrowser() {
  const { locale, t } = useI18n();
  const { product, def } = useProduct();
  const skills = skillsForProduct(product);
  const isPerp = product === "v-exchange-perp";

  return (
    <div className="space-y-5 animate-rise">
      <header>
        <h1 className="font-display text-3xl text-ink">
          {isPerp
            ? t("技能库 · V Exchange Runbook", "Skill library · V Exchange Runbooks")
            : t("技能库 · 排查 Playbook", "Skill library · RCA playbooks")}
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-mist">
          {isPerp
            ? t(
                `当前产品线：${def.shortZh}。Runbook V18 排查路径（表格分支保留在知识页）；交互清单逐步勾选。后续分册将继续写入。`,
                `Product: ${def.shortEn}. Runbook V18 paths (branch tables on KB pages); interactive checklists here. More parts incoming.`,
              )
            : t(
                "可交互的步骤清单：固化证据 → 查询占位 SQL → 止血 → 客户处置。每个 Skill 关联相关风险场景。",
                "Interactive checklists: capture evidence → placeholder SQL → contain → disposition. Each skill links related risks.",
              )}
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {skills.map((s, i) => (
          <Link
            key={s.id}
            href={`/kb/${s.slug}`}
            className="rounded-xl border border-line bg-white/80 p-5 transition hover:border-sea/40 hover:bg-white animate-rise"
            style={{ animationDelay: `${i * 40}ms` }}
          >
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-display text-xl text-ink">
                {locale === "zh-CN" ? s.titleZh : s.title}
              </h2>
              <SeverityBadge s={s.severity} />
            </div>
            <p className="mt-2 text-sm text-mist">
              {locale === "zh-CN" ? s.summaryZh : s.summary}
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {s.owners.map((o) => (
                <span key={o} className="rounded border border-line bg-paper px-2 py-0.5 text-[11px] text-mist">
                  {o}
                </span>
              ))}
              <span className="rounded border border-line bg-paper px-2 py-0.5 text-[11px] text-mist">
                {s.steps.length} {t("步", "steps")}
              </span>
              <span
                className="rounded border border-sea/30 bg-sea-soft/40 px-2 py-0.5 text-[11px] text-sea"
                onClick={(e) => {
                  e.preventDefault();
                  window.location.href = `/skills/${s.slug}`;
                }}
              >
                {t("交互清单", "Checklist")}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
