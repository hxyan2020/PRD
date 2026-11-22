"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AgentDocBar } from "@/components/AgentDocBar";
import type { Article } from "@/lib/data/articles";
import { useI18n } from "@/lib/i18n/context";

export function ArticleView({ article }: { article: Article }) {
  const { locale, t } = useI18n();
  const [isAdmin, setIsAdmin] = useState(false);
  const body = locale === "zh-CN" ? article.bodyZh : article.body;
  const title = locale === "zh-CN" ? article.titleZh : article.title;
  const summary = locale === "zh-CN" ? article.summaryZh : article.summary;

  useEffect(() => {
    void fetch("/api/me")
      .then((r) => r.json())
      .then((d: { isAdmin?: boolean }) => setIsAdmin(!!d.isAdmin))
      .catch(() => undefined);
  }, []);

  return (
    <article className="animate-rise space-y-5">
      <Link href="/knowledge" className="text-xs text-sea hover:underline">
        ← {t("返回原则", "Back")}
      </Link>
      <h1 className="font-display text-3xl text-ink">{title}</h1>
      <p className="text-sm text-mist">{summary}</p>
      <AgentDocBar
        nodeKey={article.slug}
        getMarkdown={async () => {
          try {
            const res = await fetch(
              `/api/kb/${encodeURIComponent(article.slug)}?markdown=1&locale=${locale === "en" ? "en" : "zh-CN"}`,
            );
            if (res.ok) {
              const data = (await res.json()) as { markdown: string };
              return data.markdown;
            }
          } catch {
            /* fall through */
          }
          return [
            `# ${title}`,
            "",
            `> ${summary}`,
            "",
            `- slug: \`${article.slug}\``,
            `- tags: ${article.tags.join(", ") || "—"}`,
            "",
            "---",
            "",
            body,
            "",
          ].join("\n");
        }}
        label={`agent.md · ${article.slug}`}
        isAdmin={isAdmin}
      />
      <div className="prose-desk max-w-3xl whitespace-pre-wrap rounded-2xl border border-line bg-white/85 p-5 text-sm text-ink-2 sm:p-7">
        {body}
      </div>
    </article>
  );
}
