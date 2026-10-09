"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CollectionItem } from "@/lib/types";

export function CollectionPage() {
  const [items, setItems] = useState<CollectionItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [needLogin, setNeedLogin] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/collection");
        const data = await res.json();
        if (res.status === 401) {
          if (!cancelled) setNeedLogin(true);
          return;
        }
        if (!res.ok) throw new Error(data.error || "Failed to load collection");
        if (!cancelled) setItems(data.items ?? []);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function remove(slug: string) {
    const res = await fetch("/api/collection", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug }),
    });
    if (!res.ok) return;
    setItems((prev) => (prev ? prev.filter((i) => i.ideaSlug !== slug) : prev));
  }

  if (needLogin) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <h1 className="font-display text-4xl text-foam">Your collection</h1>
        <p className="mt-4 text-sm text-mist">Log in to save and review collected ideas.</p>
        <div className="mt-6 flex gap-3">
          <Link href="/login" className="btn-primary">
            Log in
          </Link>
          <Link href="/register" className="btn-ghost">
            Register
          </Link>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="mx-auto max-w-3xl px-4 py-16 text-sm text-copper sm:px-6">{error}</div>;
  }

  if (!items) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-sm text-mist sm:px-6">
        Loading collection…
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-celadon">
        Saved for you
      </p>
      <h1 className="mt-3 font-display text-4xl text-foam">Collection</h1>
      <p className="mt-3 text-sm text-mist">
        Ideas you've collected, including matching analysis when a profile was available.
      </p>

      {items.length === 0 ? (
        <p className="mt-10 text-sm text-mist">
          Nothing saved yet. Open an idea or today's pick and tap{" "}
          <span className="text-foam">Collect idea + match</span>.
        </p>
      ) : (
        <ul className="mt-10 divide-y divide-white/10 border-t border-white/10">
          {items.map((item) => (
            <li key={item.id} className="py-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <Link
                    href={`/ideas/${item.ideaSlug}`}
                    className="font-display text-2xl text-foam hover:text-white"
                  >
                    {item.idea.name}
                  </Link>
                  <p className="mt-1 text-xs text-mist">
                    {item.idea.industry} · {item.idea.sector}
                    {item.match ? ` · Match ${item.match.score}%` : ""}
                  </p>
                  {item.match?.matched[0] ? (
                    <p className="mt-2 text-xs text-celadon">
                      Matched · {item.match.matched[0].dimension}: {item.match.matched[0].detail}
                    </p>
                  ) : null}
                  {item.match?.gaps[0] ? (
                    <p className="mt-1 text-xs text-mist">
                      Gap · {item.match.gaps[0].dimension}: {item.match.gaps[0].closeGap}
                    </p>
                  ) : null}
                </div>
                <button
                  type="button"
                  className="btn-ghost shrink-0 self-start"
                  onClick={() => void remove(item.ideaSlug)}
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
