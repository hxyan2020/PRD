"use client";

import Link from "next/link";
import { RatingsPanel } from "@/components/RatingsPanel";
import { useI18n } from "@/lib/i18n/context";
import { presentEvidence } from "@/lib/i18n/present";
import { similarityPercent } from "@/lib/related";
import type { Evidence, RelatedEvidence } from "@/lib/types";

export function EvidenceDetail({
  item,
  related,
}: {
  item: Evidence;
  related: RelatedEvidence[];
}) {
  const { t, locale } = useI18n();
  const presented = presentEvidence(item, locale);
  if (!presented.available) {
    return (
      <article className="pt-8">
        <Link
          href="/evidence"
          className="font-mono text-[11px] uppercase tracking-wider text-mist hover:text-signal"
        >
          ← {t("nav.evidence")}
        </Link>
        <p className="mt-6 text-ink-soft">{t("evidence.empty")}</p>
      </article>
    );
  }
  const bodyFields: Array<{ key: keyof typeof presented.body; label: string }> = [
    { key: "what", label: t("detail.what") },
    { key: "where", label: t("detail.where") },
    { key: "when", label: t("detail.when") },
    { key: "how", label: t("detail.how") },
    { key: "why", label: t("detail.why") },
  ];

  return (
    <article className="pt-4 sm:pt-8">
      <Link
        href="/evidence"
        className="font-mono text-[11px] uppercase tracking-wider text-mist hover:text-signal"
      >
        ← {t("nav.evidence")}
      </Link>

      <p className="mt-5 max-w-3xl font-display text-3xl leading-snug text-ink sm:text-4xl">
        {presented.caption}
      </p>

      <dl className="mt-6 grid gap-3 font-mono text-xs uppercase tracking-wider text-mist sm:grid-cols-3">
        <div>
          <dt>{t("detail.sources")}</dt>
          <dd className="mt-1 text-sm normal-case tracking-normal text-ink">
            {item.sourceCount}
          </dd>
        </div>
        <div>
          <dt>{t("detail.languages")}</dt>
          <dd className="mt-1 text-sm normal-case tracking-normal text-ink">
            {item.languages.join(", ")}
          </dd>
        </div>
        <div>
          <dt>{t("detail.firstSeen")}</dt>
          <dd className="mt-1 text-sm normal-case tracking-normal text-ink">
            {new Date(item.firstSeenAt).toLocaleDateString(locale, {
              timeZone: "Asia/Singapore",
            })}
          </dd>
        </div>
      </dl>

      {item.images.length > 0 ? (
        <section className="mt-8">
          <h2 className="font-display text-2xl text-ink">{t("detail.images")}</h2>
          <ul className="mt-4 grid gap-4 sm:grid-cols-2">
            {item.images.map((img) => (
              <li key={img.url} className="overflow-hidden border border-line/70 bg-ink/5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  alt={presented.caption}
                  className="h-auto w-full object-cover"
                  loading="lazy"
                />
                <p className="px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-mist">
                  {img.credit}
                  {img.width && img.height ? ` · ${img.width}×${img.height}` : ""}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mt-10 space-y-6 border-t border-line/80 pt-6">
        {bodyFields.map(({ key, label }) =>
          presented.body[key] ? (
            <div key={key}>
              <h2 className="font-mono text-[11px] uppercase tracking-[0.18em] text-signal">
                {label}
              </h2>
              <p className="mt-2 max-w-3xl text-base leading-relaxed text-ink-soft sm:text-lg">
                {presented.body[key]}
              </p>
            </div>
          ) : null,
        )}
      </section>

      <div className="mt-6 flex flex-wrap gap-2">
        {item.categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/categories/${cat.slug}`}
            className="inline-flex border border-line px-3 py-2 text-sm text-ink transition hover:border-signal hover:text-signal"
          >
            {cat.name}
          </Link>
        ))}
      </div>

      <RatingsPanel ratings={item.ratings} />

      <section className="mt-10 border-t border-line/80 pt-6">
        <h2 className="font-display text-2xl text-ink">{t("detail.original")}</h2>
        <ul className="mt-4 divide-y divide-line/70 border-y border-line/70">
          {item.sources.map((source) => (
            <li key={source.id} className="py-4">
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="break-all font-medium text-signal hover:underline"
              >
                {source.url}
              </a>
              <p className="mt-1 font-mono text-[11px] uppercase tracking-wider text-mist">
                {source.publisher || "web"} · {source.language}
                {source.language === locale && source.title
                  ? ` · ${source.title}`
                  : ""}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10 border-t border-line/80 pt-6">
        <h2 className="font-display text-2xl text-ink">{t("detail.related")}</h2>
        {related.length === 0 ? (
          <p className="mt-3 text-mist">—</p>
        ) : (
          <ul className="mt-4 divide-y divide-line/70 border-y border-line/70">
            {related.map((row) => {
              const other = presentEvidence(row.evidence, locale);
              const reason =
                row.reason === "both"
                  ? t("detail.both")
                  : row.reason === "same-category"
                    ? t("detail.sameCategory")
                    : t("detail.contentSimilar");
              return (
                <li key={row.evidence.id} className="py-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <Link
                      href={`/evidence/${row.evidence.slug}`}
                      className="font-display text-xl text-ink transition hover:text-signal"
                    >
                      {other.caption}
                    </Link>
                    <span className="font-mono text-sm tabular-nums text-signal">
                      {t("detail.similarity")} {similarityPercent(row.similarity)}
                    </span>
                  </div>
                  <p className="mt-1 font-mono text-[11px] uppercase tracking-wider text-mist">
                    {reason}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </article>
  );
}
