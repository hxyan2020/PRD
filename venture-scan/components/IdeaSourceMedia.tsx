"use client";

import Link from "next/link";
import { Flag } from "@/components/Flag";
import { withBase } from "@/lib/base-path";
import { countryToFlagCode } from "@/lib/flag-codes";
import { relativeTime } from "@/lib/format";
import { relatedSourcesForIdea } from "@/lib/idea-sources";
import { useI18n } from "@/lib/i18n/context";
import { attachMediaToSources } from "@/lib/source-media";
import type { StartupIdea } from "@/lib/types";

const KIND_LABEL: Record<string, string> = {
  news: "News",
  registry: "Registry",
  fundraising: "Fundraising",
  community: "Community",
  government: "Government",
  aggregator: "Aggregator",
};

export function IdeaSourceMedia({ idea }: { idea: StartupIdea }) {
  const { t } = useI18n();
  const items = attachMediaToSources(relatedSourcesForIdea(idea, "overview", 6));

  if (items.length === 0) return null;

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

      <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {items.map(({ source, mediaPath, mediaKind }) => (
          <li key={source.id}>
            <a
              href={source.url}
              target="_blank"
              rel="noreferrer"
              className="group flex gap-3 overflow-hidden rounded-2xl border border-white/10 bg-ink-2/50 p-3 transition hover:border-celadon/40 hover:bg-ink-2/80"
            >
              <span className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-white sm:h-24 sm:w-24">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={withBase(mediaPath)}
                  alt=""
                  width={96}
                  height={96}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.04]"
                  onError={(e) => {
                    const img = e.currentTarget;
                    const fallback = withBase(`/logos/${source.id}.png`);
                    if (img.dataset.fallback === "1") {
                      img.style.display = "none";
                      return;
                    }
                    img.dataset.fallback = "1";
                    img.src = fallback;
                    img.className =
                      "h-full w-full object-contain p-3 transition duration-300 group-hover:scale-[1.04]";
                  }}
                />
              </span>
              <span className="min-w-0 flex-1 py-0.5">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="truncate font-medium text-foam">{source.name}</span>
                  <span className="rounded-md border border-white/10 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em] text-mist">
                    {KIND_LABEL[source.kind] ?? source.kind}
                  </span>
                </span>
                <span className="mt-1 line-clamp-2 text-xs leading-relaxed text-mist">
                  {source.description}
                </span>
                <span className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-mist/80">
                  <span className="inline-flex items-center gap-1">
                    <Flag
                      code={countryToFlagCode(source.countries[0] ?? "") ?? ""}
                      title={source.countries[0]}
                      size="sm"
                    />
                    <span className="truncate">{source.region}</span>
                  </span>
                  <span aria-hidden>·</span>
                  <span>
                    {t("ideaMedia.extracted")} · {mediaKind}
                  </span>
                  <span aria-hidden>·</span>
                  <span>
                    {t("sources.lastSourced")} {relativeTime(source.lastSourcedAt)}
                  </span>
                </span>
              </span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
