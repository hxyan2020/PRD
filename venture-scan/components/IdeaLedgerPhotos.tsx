"use client";

import { withBase } from "@/lib/base-path";
import { photosForIdea } from "@/lib/idea-photos";
import { useI18n } from "@/lib/i18n/context";

const PREVIEW = 3;

/** Compact sourced-photo strip for Ideas ledger rows (and homepage today list). */
export function IdeaLedgerPhotos({
  slug,
  name,
}: {
  slug: string;
  name: string;
}) {
  const { t } = useI18n();
  const photos = photosForIdea(slug, 9);
  if (photos.length === 0) return null;

  const preview = photos.slice(0, PREVIEW);
  const extra = photos.length - preview.length;

  return (
    <div className="idea-ledger-photos shrink-0">
      <ul className="flex gap-1.5 overflow-x-auto pb-0.5 sm:w-[10.75rem] sm:flex-wrap sm:overflow-visible">
        {preview.map((photo, index) => (
          <li
            key={photo.id}
            className="relative h-[4.25rem] w-[5.5rem] shrink-0 overflow-hidden rounded-lg border border-black/10 bg-ink sm:h-[3.75rem] sm:w-[5rem]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={withBase(photo.imagePath)}
              alt=""
              width={160}
              height={120}
              loading={index === 0 ? "eager" : "lazy"}
              decoding="async"
              className="h-full w-full object-cover"
            />
            {index === preview.length - 1 && extra > 0 ? (
              <span className="absolute inset-0 flex items-center justify-center bg-black/45 font-mono text-[11px] text-white">
                +{extra}
              </span>
            ) : null}
          </li>
        ))}
      </ul>
      <p className="mt-1.5 font-mono text-[9px] uppercase tracking-[0.14em] text-mist/80">
        {t("ledger.photos", { count: photos.length })}
        <span className="sr-only"> — {name}</span>
      </p>
    </div>
  );
}
