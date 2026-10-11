"use client";

import { useState } from "react";
import Image from "next/image";

export function ProductGallery({ images, alt }: { images: string[]; alt: string }) {
  const unique = [...new Set(images.filter(Boolean))];
  const [index, setIndex] = useState(0);
  const src = unique[index] ?? unique[0];
  if (!src) return null;

  return (
    <div>
      <div className="relative aspect-[4/3] min-h-[280px] overflow-hidden rounded-3xl border border-white/10 bg-ink-3">
        <Image
          src={src}
          alt={alt}
          fill
          priority={index === 0}
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-cover"
        />
      </div>
      {unique.length > 1 ? (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {unique.map((url, i) => (
            <button
              key={url}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Photo ${i + 1} of ${unique.length}`}
              aria-current={i === index}
              className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border ${
                i === index ? "border-rust" : "border-white/10"
              }`}
            >
              <Image src={url} alt="" fill sizes="64px" className="object-cover" />
            </button>
          ))}
        </div>
      ) : null}
      <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-mist">
        {index + 1} / {unique.length} product photos
      </p>
    </div>
  );
}
