"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Map = Record<string, string>;

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
    fetch("/api/storefront")
      .then((r) => r.json())
      .then((d: { slugs?: Map }) => setExisting(d.slugs?.[slug] ?? null))
      .catch(() => {});
  }, [slug]);

  async function onGenerate(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Generate failed");
      router.push(`/storefront/${data.product.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generate failed");
      setBusy(false);
    }
  }

  if (existing && !busy) {
    return (
      <a
        href={`/storefront/${existing}`}
        onClick={(e) => e.stopPropagation()}
        className={
          variant === "compact"
            ? "chip chip-signal"
            : "inline-flex rounded-full border border-signal/40 bg-signal/10 px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.16em] text-signal"
        }
      >
        Open sourced listing
      </a>
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
          1688 pack · images · specs · terms · SQLite
        </span>
      ) : null}
      {error ? <span className="text-xs text-rose-400">{error}</span> : null}
    </span>
  );
}
