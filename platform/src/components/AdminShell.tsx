"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { NAV_ITEMS } from "@/lib/nav";
import { cn } from "@/lib/utils";
import type { SessionUser } from "@/lib/types";
import { LogOut, Menu, X } from "lucide-react";
import { UI_LOCALE_COOKIE, navLabel, shellCopy, type UiLocale } from "@/lib/i18n";

function readLocaleCookie(): UiLocale {
  if (typeof document === "undefined") return "en";
  const m = document.cookie.match(new RegExp(`(?:^|; )${UI_LOCALE_COOKIE}=([^;]*)`));
  const v = m?.[1] ? decodeURIComponent(m[1]) : "en";
  return v === "zh-Hant" || v === "zh-TW" || v === "zh" ? "zh-Hant" : "en";
}

export function AdminShell({
  user,
  permissions,
  children,
}: {
  user: SessionUser;
  permissions: string[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [locale, setLocale] = useState<UiLocale>("en");
  const can = (perm: string) => permissions.includes("*") || permissions.includes(perm);
  const copy = shellCopy(locale);

  useEffect(() => {
    setLocale(readLocaleCookie());
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  function setLang(next: UiLocale) {
    document.cookie = `${UI_LOCALE_COOKIE}=${encodeURIComponent(next)}; path=/; max-age=31536000; samesite=lax`;
    setLocale(next);
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const nav = (
    <>
      <div>
        <div className="text-[0.7rem] uppercase tracking-[0.18em] text-teal-200/80">{copy.brandEyebrow}</div>
        <div className="mt-1 font-[family-name:var(--font-display)] text-xl text-white">{copy.brandTitle}</div>
        <div className="mt-1 text-xs text-slate-300">{copy.brandSub}</div>
      </div>

      <nav className="flex flex-col gap-1 flex-1 overflow-y-auto pr-1">
        {NAV_ITEMS.filter((item) => can(item.permission)).map((item) => {
          const active = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition",
                active ? "bg-white/12 text-white" : "text-slate-300 hover:bg-white/8 hover:text-white"
              )}
            >
              <Icon size={16} className="shrink-0" />
              <span className="leading-snug">{navLabel(item.href, locale, item.label)}</span>
            </Link>
          );
        })}
      </nav>

      <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs">
        <div className="font-semibold text-white">{user.name}</div>
        <div className="mt-0.5 text-slate-300 break-all">{user.email}</div>
        <div className="mt-2 flex flex-wrap gap-1">
          <span className="badge border-teal-400/30 bg-teal-400/10 text-teal-100">{user.role_code}</span>
          {user.department_code && (
            <span className="badge border-white/20 bg-white/10 text-slate-100">{user.department_code}</span>
          )}
        </div>
        <div className="mt-3 flex gap-1">
          <button
            type="button"
            className={cn(
              "rounded-lg px-2 py-1 border text-[11px]",
              locale === "en" ? "bg-white/15 border-white/30 text-white" : "border-white/15 text-slate-300"
            )}
            onClick={() => setLang("en")}
          >
            EN
          </button>
          <button
            type="button"
            className={cn(
              "rounded-lg px-2 py-1 border text-[11px]",
              locale === "zh-Hant" ? "bg-white/15 border-white/30 text-white" : "border-white/15 text-slate-300"
            )}
            onClick={() => setLang("zh-Hant")}
          >
            繁中
          </button>
        </div>
        <button onClick={logout} className="mt-3 inline-flex items-center gap-1.5 text-slate-300 hover:text-white">
          <LogOut size={14} /> {copy.signOut}
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="hidden lg:flex bg-[var(--sidebar)] text-[var(--sidebar-ink)] px-4 py-5 flex-col gap-6 sticky top-0 h-screen">
        {nav}
      </aside>

      {open && (
        <div className="lg:hidden fixed inset-0 z-40">
          <button type="button" className="absolute inset-0 bg-black/45" aria-label="Close menu" onClick={() => setOpen(false)} />
          <aside className="relative z-50 h-full w-[min(86vw,300px)] bg-[var(--sidebar)] text-[var(--sidebar-ink)] px-4 py-5 flex flex-col gap-6 shadow-xl overflow-hidden">
            <button
              type="button"
              className="absolute right-3 top-3 text-slate-200"
              aria-label="Close"
              onClick={() => setOpen(false)}
            >
              <X size={18} />
            </button>
            {nav}
          </aside>
        </div>
      )}

      <main className="min-w-0">
        <header className="border-b border-[var(--line)] bg-white/80 backdrop-blur px-4 sm:px-6 py-3 sm:py-4 sticky top-0 z-10">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <button
                type="button"
                className="lg:hidden btn px-2 py-1.5"
                aria-label={copy.menu}
                onClick={() => setOpen(true)}
              >
                <Menu size={18} />
              </button>
              <div className="min-w-0">
                <div className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">{copy.headerEyebrow}</div>
                <div className="font-[family-name:var(--font-display)] text-base sm:text-lg text-[var(--ink)] truncate">
                  {copy.headerTitle}
                </div>
              </div>
            </div>
            <div className="text-right text-[11px] sm:text-xs text-[var(--muted)] shrink-0">
              <div>
                {copy.messenger}: <strong className="text-[var(--ink)]">Lark</strong>
              </div>
              <div>
                {copy.indicators}: <strong className="text-[var(--ink)]">Monitor 2.0</strong>
              </div>
            </div>
          </div>
        </header>
        <div className="p-4 sm:p-6">{children}</div>
      </main>
    </div>
  );
}
