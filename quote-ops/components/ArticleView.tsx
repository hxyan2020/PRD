"use client";

import Link from "next/link";
import type { Article } from "@/lib/data/articles";
import { useI18n } from "@/lib/i18n/context";

export function ArticleView({ article }: { article: Article }) {
  const { locale, t } = useI18n();
  const body = locale === "zh-CN" ? article.bodyZh : article.body;

  return (
    <article className="animate-rise">
      <Link href="/knowledge" className="text-xs text-sea hover:underline">
        ← {t("返回原则", "Back")}
      </Link>
      <h1 className="mt-3 font-display text-3xl text-ink">
        {locale === "zh-CN" ? article.titleZh : article.title}
      </h1>
      <p className="mt-2 text-sm text-mist">
        {locale === "zh-CN" ? article.summaryZh : article.summary}
      </p>
      <div className="prose-desk mt-6 max-w-3xl whitespace-pre-wrap rounded-2xl border border-line bg-white/85 p-5 text-sm text-ink-2 sm:p-7">
        {body}
      </div>
    </article>
  );
}
