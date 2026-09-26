"use client";

import { useState } from "react";
import { DESK_PASSWORD, DESK_USERNAME } from "@/lib/deskAccount";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { useDeskAccount } from "./DeskAccountProvider";

export function AccountBar() {
  const { t } = useLocale();
  const { ready, session, showCredentials, dismissCredentials, login, logout } = useDeskAccount();
  const [username, setUsername] = useState(DESK_USERNAME);
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  if (!ready) return null;

  if (!session) {
    return (
      <form
        className="flex flex-wrap items-center justify-end gap-1.5"
        onSubmit={(event) => {
          event.preventDefault();
          const ok = login(username, password);
          setError(!ok);
        }}
      >
        <input
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          autoComplete="username"
          aria-label={t("username")}
          placeholder={t("username")}
          className="w-24 rounded-md border border-line bg-panel px-2 py-1.5 font-mono text-xs text-paper outline-none focus:border-gold/50 md:w-28"
        />
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          aria-label={t("password")}
          placeholder={t("password")}
          className="w-28 rounded-md border border-line bg-panel px-2 py-1.5 font-mono text-xs text-paper outline-none focus:border-gold/50"
        />
        <button
          type="submit"
          className="min-h-8 rounded-full border border-gold px-2.5 font-mono text-[11px] text-gold"
        >
          {t("signIn")}
        </button>
        {error ? <span className="w-full text-right font-mono text-[11px] text-down">{t("signInError")}</span> : null}
      </form>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex items-center gap-1.5">
        <span className="max-w-[7rem] truncate font-mono text-[11px] text-gold md:max-w-none">
          {t("signedInAs", { name: session.username })}
        </span>
        <button
          type="button"
          onClick={logout}
          className="rounded-full border border-line px-2 py-1 font-mono text-[11px] text-muted hover:border-gold/40 hover:text-paper"
        >
          {t("signOut")}
        </button>
      </div>
      {showCredentials ? (
        <div className="max-w-[16rem] rounded-lg border border-gold/30 bg-gold/10 px-2.5 py-2 text-left font-mono text-[11px] leading-5 text-paper md:max-w-xs">
          <p>
            {t("deskAccountHint", { name: DESK_USERNAME, password: DESK_PASSWORD })}
          </p>
          <button
            type="button"
            onClick={dismissCredentials}
            className="mt-1 text-gold underline decoration-gold/30 underline-offset-2"
          >
            {t("dismiss")}
          </button>
        </div>
      ) : null}
    </div>
  );
}
