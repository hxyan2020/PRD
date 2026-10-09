"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { authLogout, authMe } from "@/lib/client-api";
import { useI18n } from "@/lib/i18n/context";

type User = { id: string; email: string };

export function AuthNav({ stacked = false }: { stacked?: boolean }) {
  const router = useRouter();
  const { t } = useI18n();
  const [user, setUser] = useState<User | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const me = await authMe();
      if (!cancelled) setUser(me);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function logout() {
    await authLogout();
    setUser(null);
    router.push("/");
    router.refresh();
  }

  const linkClass = stacked
    ? "rounded-xl px-3 py-3 text-foam hover:bg-white/5"
    : "hover:text-foam";

  if (user === undefined) {
    return <span className="text-sm text-mist/50">…</span>;
  }

  if (!user) {
    return (
      <div className={stacked ? "flex flex-col gap-1" : "contents"}>
        <Link href="/login" className={linkClass}>
          {t("nav.login")}
        </Link>
        <Link href="/register" className={linkClass}>
          {t("nav.register")}
        </Link>
      </div>
    );
  }

  return (
    <div className={stacked ? "flex flex-col gap-1" : "contents"}>
      <Link href="/collection" className={linkClass}>
        {t("nav.collection")}
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
      <button
        type="button"
        onClick={() => void logout()}
        className={stacked ? `${linkClass} text-start` : "hover:text-foam"}
      >
        {t("nav.logout")}
      </button>
    </div>
  );
}
