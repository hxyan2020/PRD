"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  authMe,
  getCollectedSlug,
  removeFromCollection,
  saveToCollection,
} from "@/lib/client-api";
import { useI18n } from "@/lib/i18n/context";
import { isProfileReady, loadProfileFromStorage } from "@/lib/profile";
import type { IdeaMatch, StartupIdea } from "@/lib/types";

export function CollectButton({
  idea,
  match,
}: {
  idea: StartupIdea;
  match?: IdeaMatch | null;
}) {
  const { t } = useI18n();
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const me = await authMe();
      if (cancelled) return;
      setLoggedIn(Boolean(me));
      if (!me) return;
      const item = await getCollectedSlug(idea.slug);
      if (!cancelled) setSaved(Boolean(item));
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
      const result = await saveToCollection({
        idea,
        match: match ?? null,
        profile: profile && isProfileReady(profile) ? profile : null,
      });
      if (result.error || !result.item) throw new Error(result.error || "Could not save");
      setSaved(true);
      setMessage(result.item.match ? t("collect.savedBoth") : t("collect.savedIdea"));
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
      const result = await removeFromCollection(idea.slug);
      if (result.error) throw new Error(result.error);
      setSaved(false);
      setMessage(t("collect.removed"));
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
          {t("nav.login")}
        </Link>{" "}
        {t("collect.loginPrompt")}
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {saved ? (
        <button type="button" className="btn-ghost" disabled={busy} onClick={() => void remove()}>
          {busy ? t("collect.updating") : t("collect.remove")}
        </button>
      ) : (
        <button type="button" className="btn-primary" disabled={busy} onClick={() => void collect()}>
          {busy ? t("collect.saving") : t("collect.save")}
        </button>
      )}
      {message ? <p className="text-xs text-mist">{message}</p> : null}
    </div>
  );
}
