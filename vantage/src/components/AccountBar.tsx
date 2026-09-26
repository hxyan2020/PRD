"use client";

import { useLocale } from "@/lib/i18n/LocaleProvider";
import { useDeskAccount } from "./DeskAccountProvider";

export function AccountBar() {
  const { t } = useLocale();
  const { ready, session, openLogin, logout } = useDeskAccount();

  if (!ready) return null;

  if (!session) {
    return (
      <div className="flex items-center justify-end gap-1.5">
        <span className="font-mono text-[11px] text-muted">{t("browseAsGuest")}</span>
        <button
          type="button"
          onClick={() => openLogin()}
          className="min-h-8 rounded-full border border-gold px-2.5 font-mono text-[11px] text-gold hover:bg-gold/10"
        >
          {t("signIn")}
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-end gap-1.5">
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
  );
}
