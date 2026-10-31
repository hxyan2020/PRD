"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { listingSlugMap, saveListing } from "@/lib/client-store";
import { buildFactoryListing } from "@/lib/listing-pack";
import { tryApiJson } from "@/lib/try-api";
import type { SourcedProduct } from "@/lib/storefront-types";

export function GenerateButton({
  slug,
  variant = "primary",
}: {
  slug: string;
  variant?: "primary" | "compact";
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existing, setExisting] = useState<string | null>(null);

  useEffect(() => {
    const local = listingSlugMap()[slug];
    if (local) setExisting(local);
    tryApiJson<{ slugs?: Record<string, string> }>("/api/storefront").then((r) => {
      if (r.ok && r.data.slugs?.[slug]) setExisting(r.data.slugs[slug]);
    });
  }, [slug]);

  async function onGenerate(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setBusy(true);
    setError(null);
    try {
      const res = await tryApiJson<{ product: SourcedProduct }>("/api/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      if (res.ok) {
        saveListing(res.data.product);
        router.push(`/storefront/${res.data.product.id}`);
        router.refresh();
        return;
      }
      if (!res.fallback) throw new Error(res.error ?? "Generate failed");
      const product = buildFactoryListing(slug);
      saveListing(product);
      router.push(`/storefront/${product.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generate failed");
      setBusy(false);
    }
  }

  if (existing && !busy) {
    return (
      <Link
        href={`/storefront/${existing}`}
        onClick={(e) => e.stopPropagation()}
        className={
          variant === "compact"
            ? "chip chip-signal"
            : "inline-flex rounded-full border border-signal/40 bg-signal/10 px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.16em] text-signal"
        }
      >
        Open sourced listing
      </Link>
    );
  }

  return (
    <span className="inline-flex flex-col items-start gap-1" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        disabled={busy}
        onClick={onGenerate}
        className={
          variant === "compact"
            ? "chip chip-rust disabled:opacity-60"
            : "inline-flex rounded-full bg-rust px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.16em] text-ink hover:bg-rust-dim disabled:opacity-60"
        }
      >
        {busy ? "Generating…" : "Generate listing"}
      </button>
      {busy ? (
        <span className="font-mono text-[10px] uppercase tracking-widest text-mist">
          1688 pack · images · specs · terms
        </span>
      ) : null}
      {error ? <span className="text-xs text-rose-400">{error}</span> : null}
    </span>
  );
}
