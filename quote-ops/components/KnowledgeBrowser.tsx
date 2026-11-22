"use client";

import Link from "next/link";
import { ARTICLES } from "@/lib/data/articles";
import { useI18n } from "@/lib/i18n/context";

export function KnowledgeBrowser() {
  const { locale, t } = useI18n();

  return (
    <div className="space-y-5 animate-rise">
      <header>
        <h1 className="font-display text-3xl text-ink">{t("原则与框架", "Principles & frameworks")}</h1>
        <p className="mt-2 text-sm text-mist">
          {t(
            "分类原则、优先检测、六模块框架、Healthy vs Abusive 例、三条证据链。",
            "Classification, detection priorities, six-module framework, Healthy vs Abusive example, three evidence chains.",
          )}
        </p>
      </header>
      <div className="grid gap-4">
        {ARTICLES.map((a) => (
          <Link
            key={a.id}
            href={`/knowledge/${a.slug}`}
            className="rounded-xl border border-line bg-white/85 p-5 hover:border-sea/40"
          >
            <h2 className="font-display text-xl text-ink">
              {locale === "zh-CN" ? a.titleZh : a.title}
            </h2>
            <p className="mt-2 text-sm text-mist">
              {locale === "zh-CN" ? a.summaryZh : a.summary}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
