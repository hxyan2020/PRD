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
    <article className="pt-2 sm:pt-8">
      <Link
        href="/evidence"
        className="touch-target inline-flex items-center font-mono text-[11px] uppercase tracking-wider text-mist hover:text-signal"
      >
        ← {t("nav.evidence")}
      </Link>

      <p className="mt-4 max-w-3xl font-display text-[1.65rem] font-medium leading-snug text-ink sm:mt-5 sm:text-4xl">
        {presented.caption}
      </p>

      <dl className="mt-5 grid grid-cols-2 gap-3 sm:mt-6 sm:grid-cols-3">
        {[
          { label: t("detail.sources"), value: String(item.sourceCount) },
          { label: t("detail.languages"), value: item.languages.join(", ") },
          {
            label: t("detail.firstSeen"),
            value: new Date(item.firstSeenAt).toLocaleDateString(locale, {
              timeZone: "Asia/Singapore",
            }),
          },
        ].map((cell) => (
          <div key={cell.label} className="mech-frame px-3 py-2.5">
            <dt className="font-mono text-[10px] uppercase tracking-[0.16em] text-mist">
              {cell.label}
            </dt>
            <dd className="mt-1 break-words font-mono text-sm text-signal">{cell.value}</dd>
          </div>
        ))}
      </dl>

      {item.images.length > 0 ? (
        <section className="mt-8">
          <h2 className="font-display text-xl font-medium text-ink sm:text-2xl">
            {t("detail.images")}
          </h2>
          <ul className="mt-4 grid gap-4 sm:grid-cols-2">
            {item.images.map((img) => (
              <li key={img.url} className="mech-frame overflow-hidden bg-panel/80">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  alt={presented.caption}
                  className="h-auto w-full object-cover opacity-90"
                  loading="lazy"
                />
                <p className="border-t border-line px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-mist">
                  {img.credit}
                  {img.width && img.height ? ` · ${img.width}×${img.height}` : ""}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mt-8 space-y-5 border-t border-line pt-5 sm:mt-10 sm:space-y-6 sm:pt-6">
        {bodyFields.map(({ key, label }) =>
          presented.body[key] ? (
            <div key={key}>
              <h2 className="hud-label">{label}</h2>
              <p className="mt-2 max-w-3xl text-[0.95rem] leading-relaxed text-ink-soft sm:text-lg">
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
            className="touch-target inline-flex items-center border border-line bg-panel/60 px-3 py-2 font-mono text-[11px] uppercase tracking-wider text-ink transition hover:border-signal hover:text-signal"
          >
            {cat.name}
          </Link>
        ))}
      </div>

      <RatingsPanel ratings={item.ratings} />

      <section className="mt-8 border-t border-line pt-5 sm:mt-10 sm:pt-6">
        <h2 className="font-display text-xl font-medium text-ink sm:text-2xl">
          {t("detail.original")}
        </h2>
        <ul className="mt-4 divide-y divide-line border-y border-line">
          {item.sources.map((source) => (
            <li key={source.id} className="py-4">
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="break-all text-sm font-medium leading-relaxed text-signal hover:underline sm:text-base"
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

      <section className="mt-8 border-t border-line pt-5 sm:mt-10 sm:pt-6">
        <h2 className="font-display text-xl font-medium text-ink sm:text-2xl">
          {t("detail.related")}
        </h2>
        {related.length === 0 ? (
          <p className="mt-3 text-mist">—</p>
        ) : (
          <ul className="mt-4 divide-y divide-line border-y border-line">
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
                  <div className="flex flex-col gap-1 sm:flex-row sm:flex-wrap sm:items-baseline sm:justify-between sm:gap-2">
                    <Link
                      href={`/evidence/${row.evidence.slug}`}
                      className="font-display text-lg text-ink transition hover:text-signal sm:text-xl"
                    >
                      {other.caption}
                    </Link>
                    <span className="font-mono text-sm tabular-nums text-ember">
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
