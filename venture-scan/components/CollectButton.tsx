"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { isProfileReady, loadProfileFromStorage } from "@/lib/profile";
import type { IdeaMatch, StartupIdea } from "@/lib/types";

export function CollectButton({
  idea,
  match,
}: {
  idea: StartupIdea;
  match?: IdeaMatch | null;
}) {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const me = await fetch("/api/auth/me").then((r) => r.json());
        if (cancelled) return;
        setLoggedIn(Boolean(me.user));
        if (!me.user) return;
        const col = await fetch(`/api/collection?slug=${encodeURIComponent(idea.slug)}`).then(
          (r) => r.json(),
        );
        if (!cancelled) setSaved(Boolean(col.item));
      } catch {
        if (!cancelled) setLoggedIn(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [idea.slug]);

  async function collect() {
    setBusy(true);
    setMessage(null);
    try {
      const profile = loadProfileFromStorage();
      const res = await fetch("/api/collection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: idea.slug,
          match: match ?? undefined,
          profile: profile && isProfileReady(profile) ? profile : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save");
      setSaved(true);
      setMessage(
        data.item?.match
          ? "Saved idea + matching analysis to your collection."
          : "Saved idea to your collection.",
      );
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Could not save");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/collection", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: idea.slug }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not remove");
      setSaved(false);
      setMessage("Removed from collection.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Could not remove");
    } finally {
      setBusy(false);
    }
  }

  if (loggedIn === null) return null;

  if (!loggedIn) {
    return (
      <p className="text-sm text-mist">
        <Link href="/login" className="text-celadon hover:underline">
          Log in
        </Link>{" "}
        to collect this idea and its matching analysis.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {saved ? (
        <button type="button" className="btn-ghost" disabled={busy} onClick={() => void remove()}>
          {busy ? "Updating…" : "Remove from collection"}
        </button>
      ) : (
        <button type="button" className="btn-primary" disabled={busy} onClick={() => void collect()}>
          {busy ? "Saving…" : "Collect idea + match"}
        </button>
      )}
      {message ? <p className="text-xs text-mist">{message}</p> : null}
    </div>
  );
}
