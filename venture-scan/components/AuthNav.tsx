"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { authMe } from "@/lib/client-api";
import { useI18n } from "@/lib/i18n/context";

type User = { id: string; email: string };

export function AuthNav({ stacked = false }: { stacked?: boolean }) {
  const { t } = useI18n();
  const [user, setUser] = useState<User | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const me = await authMe();
      if (!cancelled) setUser(me);
    }
    void load();
    function onAuth() {
      void load();
    }
    window.addEventListener("venturescan:auth", onAuth);
    return () => {
      cancelled = true;
      window.removeEventListener("venturescan:auth", onAuth);
    };
  }, []);

  const linkClass = stacked
    ? "rounded-xl px-3 py-3 text-foam hover:bg-white/5"
    : "hover:text-foam";

  if (user === undefined) {
    return <span className="text-sm text-mist/50">…</span>;
  }

  if (!user) {
    return (
      <Link href="/account" className={linkClass}>
        {t("nav.register")}
      </Link>
    );
  }

  return (
    <div className={stacked ? "flex flex-col gap-1" : "contents"}>
      <Link href="/account" className={linkClass} title={user.email}>
        {t("nav.account")}
      </Link>
      {!stacked ? (
        <span
          className="hidden max-w-[10rem] truncate text-xs text-mist/80 lg:inline"
          title={user.email}
        >
          {user.email}
        </span>
      ) : (
        <span className="px-3 py-1 text-xs text-mist/80">{user.email}</span>
      )}
    </div>
  );
}
