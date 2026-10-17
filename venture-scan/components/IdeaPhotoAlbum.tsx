"use client";

import { useEffect, useState } from "react";
import { withBase } from "@/lib/base-path";
import type { IdeaPhoto } from "@/lib/idea-photos";
import { useI18n } from "@/lib/i18n/context";

type Props = {
  name: string;
  photos: IdeaPhoto[];
};

/** Dossier photo album — 1–9 images from the official site and reliable media. */
export function IdeaPhotoAlbum({ name, photos }: Props) {
  const { t } = useI18n();
  const [active, setActive] = useState<number | null>(null);

  useEffect(() => {
    if (active == null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setActive(null);
      if (e.key === "ArrowRight") {
        setActive((i) => (i == null ? i : (i + 1) % photos.length));
      }
      if (e.key === "ArrowLeft") {
        setActive((i) => (i == null ? i : (i - 1 + photos.length) % photos.length));
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [active, photos.length]);

  if (photos.length === 0) return null;

  const current = active != null ? photos[active] : null;

  return (
    <section className="mt-10 animate-rise [animation-delay:80ms]">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-celadon">
            {t("ideaAlbum.kicker")}
          </p>
          <h2 className="mt-1 font-display text-2xl text-foam sm:text-3xl">
            {t("ideaAlbum.title")}
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-mist">{t("ideaAlbum.body")}</p>
        </div>
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-mist">
          {t("ideaAlbum.count", { count: photos.length })}
        </p>
      </div>

      <ul
        className={`mt-5 grid gap-2.5 ${
          photos.length === 1
            ? "grid-cols-1"
            : photos.length === 2
              ? "grid-cols-2"
              : "grid-cols-2 sm:grid-cols-3"
        }`}
      >
        {photos.map((photo, index) => (
          <li key={photo.id} className={index === 0 && photos.length >= 3 ? "sm:col-span-2 sm:row-span-2" : ""}>
            <button
              type="button"
              className="group relative block aspect-[4/3] w-full overflow-hidden rounded-xl border border-black/10 bg-ink text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-celadon"
              onClick={() => setActive(index)}
              aria-label={photo.caption || name}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={withBase(photo.imagePath)}
                alt={photo.caption || name}
                width={640}
                height={480}
                loading={index < 3 ? "eager" : "lazy"}
                decoding="async"
                className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
              />
              <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent px-3 pb-2.5 pt-8">
                <span className="block truncate font-mono text-[10px] uppercase tracking-[0.14em] text-white/90">
                  {photo.sourceLabel}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>

      {current ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={current.caption || name}
          onClick={() => setActive(null)}
        >
          <div
            className="relative max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-2xl bg-paper shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={withBase(current.imagePath)}
              alt={current.caption || name}
              className="max-h-[72vh] w-full object-contain bg-ink"
            />
            <div className="flex flex-wrap items-start justify-between gap-3 border-t border-black/10 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm text-foam">{current.caption || name}</p>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-mist">
                  {current.sourceLabel}
                  {current.sourceUrl ? (
                    <>
                      {" · "}
                      <a
                        href={current.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-celadon underline-offset-2 hover:underline"
                      >
                        {t("ideaAlbum.openSource")}
                      </a>
                    </>
                  ) : null}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {photos.length > 1 ? (
                  <>
                    <button
                      type="button"
                      className="btn-ghost px-3 py-1.5 text-xs"
                      onClick={() =>
                        setActive((i) => (i == null ? 0 : (i - 1 + photos.length) % photos.length))
                      }
                    >
                      ←
                    </button>
                    <button
                      type="button"
                      className="btn-ghost px-3 py-1.5 text-xs"
                      onClick={() =>
                        setActive((i) => (i == null ? 0 : (i + 1) % photos.length))
                      }
                    >
                      →
                    </button>
                  </>
                ) : null}
                <button
                  type="button"
                  className="btn-ghost px-3 py-1.5 text-xs"
                  onClick={() => setActive(null)}
                >
                  {t("ideaAlbum.close")}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
