"use client";

import { useEffect, useId, useState } from "react";
import { DESK_PASSWORD, DESK_USERNAME } from "@/lib/deskAccount";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { useDeskAccount } from "./DeskAccountProvider";

export function LoginModal() {
  const { t } = useLocale();
  const { loginOpen, pendingItem, closeLogin, login } = useDeskAccount();
  const titleId = useId();
  const [username, setUsername] = useState(DESK_USERNAME);
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!loginOpen) return;
    setUsername(DESK_USERNAME);
    setPassword("");
    setError(false);
  }, [loginOpen]);

  useEffect(() => {
    if (!loginOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeLogin();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closeLogin, loginOpen]);

  if (!loginOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/70 p-4 backdrop-blur-sm sm:items-center"
      onClick={closeLogin}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-md rounded-xl border border-line bg-panel p-4 shadow-2xl md:p-5"
        onClick={(event) => event.stopPropagation()}
      >
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-gold">{t("loginTitle")}</p>
        <h2 id={titleId} className="mt-1 font-serif text-xl text-paper md:text-2xl">
          {pendingItem ? t("loginToCollect") : t("collectionNeedLogin")}
        </h2>
        <p className="mt-2 font-mono text-[11px] leading-5 text-muted">{t("staySignedIn")}</p>
        <p className="mt-2 font-mono text-[11px] leading-5 text-paper">
          {t("deskAccountHint", { name: DESK_USERNAME, password: DESK_PASSWORD })}
        </p>
        <form
          className="mt-4 space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            const ok = login(username, password);
            setError(!ok);
          }}
        >
          <label className="block">
            <span className="font-mono text-[11px] uppercase tracking-wide text-muted">{t("username")}</span>
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
              autoFocus
              className="mt-1 w-full rounded-md border border-line bg-panel-2 px-3 py-2 font-mono text-sm text-paper outline-none focus:border-gold/50"
            />
          </label>
          <label className="block">
            <span className="font-mono text-[11px] uppercase tracking-wide text-muted">{t("password")}</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              className="mt-1 w-full rounded-md border border-line bg-panel-2 px-3 py-2 font-mono text-sm text-paper outline-none focus:border-gold/50"
            />
          </label>
          {error ? <p className="font-mono text-[11px] text-down">{t("signInError")}</p> : null}
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={closeLogin}
              className="min-h-9 rounded-full border border-line px-3 font-mono text-xs text-muted hover:border-gold/40 hover:text-paper"
            >
              {t("cancel")}
            </button>
            <button
              type="submit"
              className="min-h-9 rounded-full border border-gold bg-gold/10 px-3 font-mono text-xs text-gold hover:bg-gold/20"
            >
              {t("signIn")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
