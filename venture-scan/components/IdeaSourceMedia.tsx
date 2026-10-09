"use client";

import Link from "next/link";
import { withBase } from "@/lib/base-path";
import { articleCardsForIdea } from "@/lib/idea-articles";
import { useI18n } from "@/lib/i18n/context";
import type { StartupIdea } from "@/lib/types";

export function IdeaSourceMedia({ idea }: { idea: StartupIdea }) {
  const { t } = useI18n();
  const articles = articleCardsForIdea(idea.slug, 6);

  if (articles.length === 0) return null;

  return (
    <section className="mt-12 animate-rise [animation-delay:120ms]">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-celadon">
            {t("ideaMedia.kicker")}
          </p>
          <h2 className="mt-1 font-display text-2xl text-foam sm:text-3xl">
            {t("ideaMedia.title")}
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-mist">{t("ideaMedia.body")}</p>
        </div>
        <Link
          href="/sources"
          className="font-mono text-[10px] uppercase tracking-[0.16em] text-celadon underline-offset-2 hover:underline"
        >
          {t("ideaMedia.allSources")}
        </Link>
      </div>

      <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {articles.map((article) => (
          <li key={article.id}>
            <a
              href={article.url}
              target="_blank"
              rel="noreferrer"
              className="group flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-ink-2/50 transition hover:border-celadon/40 hover:bg-ink-2/80"
            >
              <span className="relative aspect-[16/10] w-full overflow-hidden bg-ink">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={withBase(article.imagePath)}
                  alt=""
                  width={640}
                  height={400}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                />
                <span className="absolute left-3 top-3 rounded-md border border-white/20 bg-ink/70 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-foam backdrop-blur">
                  {article.sourceName}
                </span>
              </span>
              <span className="flex flex-1 flex-col gap-2 p-4">
                <span className="font-display text-lg leading-snug text-foam transition group-hover:text-white">
                  {article.title}
                </span>
                {article.excerpt ? (
                  <span className="line-clamp-3 text-xs leading-relaxed text-mist">
                    {article.excerpt}
                  </span>
                ) : null}
                <span className="mt-auto pt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-celadon">
                  {t("ideaMedia.openArticle")}
                </span>
              </span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
