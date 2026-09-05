"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DeskButtons({
  slug,
  collected,
  discarded,
}: {
  slug: string;
  collected: boolean;
  discarded: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function act(action: "collect" | "discard" | "restore" | "uncollect") {
    setBusy(action);
    setError(null);
    try {
      const res = await fetch("/api/desk", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slug, action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Desk update failed");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Desk update failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <span className="inline-flex flex-wrap items-center gap-2" onClick={(e) => e.stopPropagation()}>
      {collected ? (
        <button type="button" disabled={Boolean(busy)} onClick={() => act("uncollect")} className="chip chip-gold">
          {busy === "uncollect" ? "…" : "Collected"}
        </button>
      ) : (
        <button type="button" disabled={Boolean(busy)} onClick={() => act("collect")} className="chip">
          {busy === "collect" ? "…" : "Collect"}
        </button>
      )}
      {discarded ? (
        <button type="button" disabled={Boolean(busy)} onClick={() => act("restore")} className="chip chip-signal">
          {busy === "restore" ? "…" : "Restore"}
        </button>
      ) : (
        <button type="button" disabled={Boolean(busy)} onClick={() => act("discard")} className="chip">
          {busy === "discard" ? "…" : "Discard"}
        </button>
      )}
      {error ? <span className="text-xs text-rose-400">{error}</span> : null}
    </span>
  );
}
