"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ClassBadge, FreqBadge, SeverityBadge } from "@/components/ClassBadge";
import { RISK_SCENARIOS } from "@/lib/data/risks";
import { useI18n } from "@/lib/i18n/context";
import type { RiskCategory, RiskClass, Severity } from "@/lib/types";

const CATS: { id: RiskCategory | "all"; zh: string; en: string }[] = [
  { id: "all", zh: "全部", en: "All" },
  { id: "healthy", zh: "正常策略", en: "Healthy" },
  { id: "pricing", zh: "报价/执行缺陷", en: "Pricing" },
  { id: "account", zh: "账户/费用", en: "Account" },
  { id: "market", zh: "协同/操纵", en: "Market" },
  { id: "fraud", zh: "欺诈/攻击", en: "Fraud" },
];

export function RisksBrowser() {
  const { locale, t } = useI18n();
  const [cat, setCat] = useState<(typeof CATS)[number]["id"]>("all");
  const [q, setQ] = useState("");
  const [klass, setKlass] = useState<RiskClass | "all">("all");
  const [sev, setSev] = useState<Severity | "all">("all");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return RISK_SCENARIOS.filter((r) => {
      if (cat !== "all" && r.category !== cat) return false;
      if (klass !== "all" && !r.classes.includes(klass)) return false;
      if (sev !== "all" && r.severity !== sev) return false;
      if (!needle) return true;
      const hay = [
        r.title,
        r.titleZh,
        r.howItWorks,
        r.howItWorksZh,
        ...r.tags,
        ...r.detect,
        ...r.detectZh,
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(needle) || String(r.id) === needle;
    });
  }, [cat, q, klass, sev]);

  return (
    <div className="space-y-5 animate-rise">
      <header>
        <h1 className="font-display text-3xl text-ink">
          {t("风险与套利场景目录", "Risk & arb scenario catalog")}
        </h1>
        <p className="mt-2 text-sm text-mist">
          {t(
            "86 项广覆盖清单。Broker 亏钱 ≠ 违规。H 正常 / T 待审 / A 滥用 / M 恶意。",
            "86-item discovery list. Broker loss ≠ abuse. H healthy / T review / A abusive / M malicious.",
          )}
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        {CATS.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setCat(c.id)}
            className={`rounded-md px-3 py-1.5 text-sm ${
              cat === c.id ? "bg-ink text-paper" : "border border-line bg-white text-ink-2"
            }`}
          >
            {locale === "zh-CN" ? c.zh : c.en}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("搜索标题、检测手段、标签…", "Search title, detect, tags…")}
          className="min-w-[220px] flex-1 rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none ring-sea focus:ring-2"
        />
        <select
          value={klass}
          onChange={(e) => setKlass(e.target.value as RiskClass | "all")}
          className="rounded-lg border border-line bg-white px-3 py-2 text-sm"
        >
          <option value="all">{t("分类", "Class")}</option>
          {(["H", "T", "A", "M"] as RiskClass[]).map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={sev}
          onChange={(e) => setSev(e.target.value as Severity | "all")}
          className="rounded-lg border border-line bg-white px-3 py-2 text-sm"
        >
          <option value="all">{t("严重度", "Severity")}</option>
          {(["P0", "P1", "P2", "P3"] as Severity[]).map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <span className="text-xs text-mist">
          {filtered.length} / {RISK_SCENARIOS.length}
        </span>
      </div>

      <div className="overflow-hidden rounded-xl border border-line bg-white/80">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line bg-paper/80 text-xs uppercase tracking-wide text-mist">
            <tr>
              <th className="px-3 py-2">#</th>
              <th className="px-3 py-2">{t("场景", "Scenario")}</th>
              <th className="px-3 py-2">{t("分类", "Class")}</th>
              <th className="hidden px-3 py-2 sm:table-cell">F / P</th>
              <th className="hidden px-3 py-2 md:table-cell">{t("检测", "Detect")}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className="border-b border-line/60 hover:bg-sea-soft/20">
                <td className="px-3 py-2.5 font-mono text-xs text-mist">{r.id}</td>
                <td className="px-3 py-2.5">
                  <Link href={`/risks/${r.id}`} className="font-medium text-ink hover:text-sea">
                    {locale === "zh-CN" ? r.titleZh : r.title}
                  </Link>
                  <p className="mt-0.5 line-clamp-1 text-xs text-mist">
                    {locale === "zh-CN" ? r.howItWorksZh : r.howItWorks}
                  </p>
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex flex-wrap gap-1">
                    {r.classes.map((c) => (
                      <ClassBadge key={c} c={c} />
                    ))}
                  </div>
                </td>
                <td className="hidden px-3 py-2.5 sm:table-cell">
                  <div className="flex gap-1">
                    <FreqBadge f={r.frequency} />
                    <SeverityBadge s={r.severity} />
                  </div>
                </td>
                <td className="hidden px-3 py-2.5 text-xs text-mist md:table-cell">
                  {(locale === "zh-CN" ? r.detectZh : r.detect).slice(0, 2).join(" · ")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
