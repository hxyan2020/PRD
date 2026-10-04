"use client";

import { useMemo, useState } from "react";
import { AdminLink } from "@/components/AdminLink";
import { Badge } from "@/components/ui";
import { SKILL_SCENARIOS, LINKED_SCENARIOS } from "@/lib/ai/risk-scenarios-catalog";
import { finalizeSkill } from "@/lib/ai/skill-playbook";
import { CHAIN_ZH } from "@/lib/ai/skill-zh";
import { useUiLocale } from "@/hooks/useUiLocale";
import { t } from "@/lib/i18n";

type RagDoc = {
  doc_key: string;
  title: string;
  category: string;
  product_scope: string;
};

export function KnowledgeTreeBoard({ docs }: { docs: RagDoc[] }) {
  const { locale } = useUiLocale();
  const [openDomain, setOpenDomain] = useState<string | null>(null);

  const domains = useMemo(() => {
    const map = new Map<string, typeof SKILL_SCENARIOS>();
    for (const s of SKILL_SCENARIOS) {
      const d = s.indicator.domain || "OTHER";
      const list = map.get(d) || [];
      list.push(s);
      map.set(d, list);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, []);

  const ragByCat = useMemo(() => {
    const map = new Map<string, RagDoc[]>();
    for (const d of docs) {
      const list = map.get(d.category) || [];
      list.push(d);
      map.set(d.category, list);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [docs]);

  return (
    <div className="space-y-4">
      <div className="panel p-4">
        <p className="text-sm text-[var(--muted)]">{t("tree.hint", locale)}</p>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <Badge className="bg-teal-50 text-teal-900 border-teal-200">
            {t("tree.domains", locale)} · {domains.length}
          </Badge>
          <Badge className="bg-orange-50 text-orange-900 border-orange-200">
            {t("tree.skills", locale)} · {SKILL_SCENARIOS.length}
          </Badge>
          <Badge className="bg-slate-100 text-slate-700 border-slate-200">
            {t("tree.chains", locale)} · {LINKED_SCENARIOS.length}
          </Badge>
          <Badge className="bg-emerald-50 text-emerald-900 border-emerald-200">
            {t("tree.rag", locale)} · {docs.length}
          </Badge>
        </div>
      </div>

      <div className="panel p-4 overflow-x-auto">
        <div className="min-w-[720px]">
          <div className="font-[family-name:var(--font-display)] text-lg mb-4">CRMP</div>
          <div className="relative pl-6 border-l-2 border-teal-200 space-y-6">
            <Branch title={t("tree.domains", locale)}>
              {domains.map(([domain, skills]) => {
                const expanded = openDomain === domain || openDomain === null;
                return (
                  <div key={domain} className="relative">
                    <button
                      type="button"
                      className="font-semibold text-sm"
                      onClick={() => setOpenDomain(openDomain === domain ? null : domain)}
                    >
                      {domain}{" "}
                      <span className="text-xs text-[var(--muted)]">({skills.length})</span>
                    </button>
                    {expanded && (
                      <ul className="mt-2 ml-4 space-y-1.5">
                        {skills.map((raw) => {
                          const s = finalizeSkill(raw, locale);
                          return (
                            <li key={s.code} className="text-sm">
                              <AdminLink
                                href={`/admin/skills/${encodeURIComponent(s.code)}`}
                                className="text-teal-800 underline"
                              >
                                {s.code}
                              </AdminLink>
                              <span className="text-[var(--muted)]"> — {s.name}</span>
                              <span className="ml-2 text-[10px] uppercase tracking-wide text-slate-500">
                                {s.indicator.monitor_id}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                );
              })}
            </Branch>

            <Branch title={t("tree.chains", locale)}>
              <ul className="ml-4 space-y-1.5">
                {LINKED_SCENARIOS.map((c) => {
                  const zh = locale === "zh-Hant" ? CHAIN_ZH[c.code] : undefined;
                  return (
                    <li key={c.code} className="text-sm">
                      <AdminLink href="/admin/skills" className="text-teal-800 underline">
                        {c.code}
                      </AdminLink>
                      <span className="text-[var(--muted)]"> — {zh?.name || c.name}</span>
                      <div className="text-xs text-[var(--muted)] ml-0 mt-0.5">
                        {(zh?.description || c.description) + " · "}
                        {c.linked_skills.join(", ")}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </Branch>

            <Branch title={t("tree.rag", locale)}>
              {ragByCat.map(([cat, list]) => (
                <div key={cat} className="ml-4 mb-3">
                  <div className="text-xs uppercase tracking-wide text-[var(--muted)]">{cat}</div>
                  <ul className="mt-1 space-y-1">
                    {list.map((d) => (
                      <li key={d.doc_key} className="text-sm">
                        <AdminLink href="/admin/rag" className="text-teal-800 underline">
                          {d.title}
                        </AdminLink>
                        <span className="text-xs text-[var(--muted)]"> · {d.product_scope}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </Branch>
          </div>
        </div>
      </div>
    </div>
  );
}

function Branch({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="relative">
      <span className="absolute -left-[25px] top-1.5 h-3 w-3 rounded-full bg-teal-600" />
      <h2 className="font-[family-name:var(--font-display)] text-base mb-2">{title}</h2>
      {children}
    </section>
  );
}
