"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { NAV_GROUPS, NAV_ITEMS } from "@/lib/nav";
import { cn } from "@/lib/utils";
import type { SessionUser } from "@/lib/types";
import { LogOut, LogIn, Menu, X } from "lucide-react";
import { UI_LOCALE_COOKIE, navLabel, shellCopy, type UiLocale } from "@/lib/i18n";
import { VantageLogo } from "@/components/VantageLogo";
import { SelectionChatbot } from "@/components/SelectionChatbot";
import { DEMO_SESSION_EVENT, clearDemoSession, defaultPersona, loginHref, readDemoSession, signInPersona } from "@/lib/demo-session";
import { isPublicSnapshot } from "@/lib/static-export";
import { ownerLine } from "@/lib/platform-owner";
import {
  NAV_BADGE_EVENT,
  NAV_EXTRA_KEY,
  NAV_SEEN_KEY,
  mergeNavTotals,
  readJsonRecord,
  writeJsonRecord,
  type NavBadgeBump,
} from "@/lib/nav-badges";

type NavEvents = Record<string, { count: number; latestAt: string | null }>;

function navKey(href: string, pathname: string) {
  if (href === "/admin") return pathname === "/admin" || pathname === "/admin/";
  if (href === "/admin/alerts") {
    return (
      pathname.startsWith("/admin/alerts") ||
      pathname.startsWith("/admin/ai-analyses")
    );
  }
  return pathname === href || pathname.startsWith(`${href}/`) || pathname.startsWith(href);
}

function readLocaleCookie(): UiLocale {
  if (typeof document === "undefined") return "en";
  const m = document.cookie.match(new RegExp(`(?:^|; )${UI_LOCALE_COOKIE}=([^;]*)`));
  const v = m?.[1] ? decodeURIComponent(m[1]) : "en";
  return v === "zh-Hant" || v === "zh-TW" || v === "zh" ? "zh-Hant" : "en";
}

export function AdminShell({
  user,
  permissions,
  navEvents = {},
  children,
}: {
  user: SessionUser;
  permissions: string[];
  navEvents?: NavEvents;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [locale, setLocale] = useState<UiLocale>("en");
  const [seen, setSeen] = useState<Record<string, number>>({});
  const [extra, setExtra] = useState<Record<string, number>>({});
  const [totals] = useState(() => mergeNavTotals(navEvents));
  const [sessionUser, setSessionUser] = useState(user);
  const can = (perm: string) => permissions.includes("*") || permissions.includes(perm);
  const copy = shellCopy(locale);

  useEffect(() => {
    function applyDemo() {
      const demo = readDemoSession();
      if (demo && (user.role_code === "PUBLIC_GUEST" || user.id === 0)) {
        setSessionUser(demo);
      } else {
        setSessionUser(user);
      }
    }
    setLocale(readLocaleCookie());
    setSeen(readJsonRecord(NAV_SEEN_KEY));
    setExtra(readJsonRecord(NAV_EXTRA_KEY));
    applyDemo();
    window.addEventListener(DEMO_SESSION_EVENT, applyDemo);
    return () => window.removeEventListener(DEMO_SESSION_EVENT, applyDemo);
  }, [user]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    function onBump(ev: Event) {
      const d = (ev as CustomEvent<NavBadgeBump>).detail;
      if (!d?.href || !d.delta) return;
      setExtra((prev) => {
        const next = { ...prev, [d.href]: (prev[d.href] || 0) + d.delta };
        writeJsonRecord(NAV_EXTRA_KEY, next);
        return next;
      });
    }
    window.addEventListener(NAV_BADGE_EVENT, onBump);
    return () => window.removeEventListener(NAV_BADGE_EVENT, onBump);
  }, []);

  useEffect(() => {
    const hits = Object.keys(totals).filter((href) => navKey(href, pathname));
    if (!hits.length) return;
    setSeen((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const href of hits) {
        const v = (totals[href] || 0) + (extra[href] || 0);
        if (next[href] !== v) {
          next[href] = v;
          changed = true;
        }
      }
      if (!changed) return prev;
      writeJsonRecord(NAV_SEEN_KEY, next);
      return next;
    });
    setExtra((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const href of hits) {
        if (next[href]) {
          next[href] = 0;
          changed = true;
        }
      }
      if (!changed) return prev;
      writeJsonRecord(NAV_EXTRA_KEY, next);
      return next;
    });
  }, [pathname, totals, extra]);

  useEffect(() => {
    document.body.classList.toggle("nav-open", open);
    return () => document.body.classList.remove("nav-open");
  }, [open]);

  useEffect(() => {
    document.documentElement.lang = locale === "zh-Hant" ? "zh-Hant" : "en";
  }, [locale]);

  function setLang(next: UiLocale) {
    document.cookie = `${UI_LOCALE_COOKIE}=${encodeURIComponent(next)}; path=/; max-age=31536000; samesite=lax`;
    setLocale(next);
    window.dispatchEvent(new Event("crmp-ui-locale"));
    router.refresh();
  }

  async function logout() {
    clearDemoSession();
    if (!isPublicSnapshot()) {
      await fetch("/api/auth/logout", { method: "POST" }).catch(() => null);
    }
    router.push("/admin");
    router.refresh();
  }

  async function signInHere() {
    await signInPersona(defaultPersona());
    router.refresh();
  }

  const langToggle = (
    <div className="flex gap-1">
      <button
        type="button"
        className={cn(
          "rounded-lg px-2.5 py-1.5 border text-[11px] min-h-8",
          locale === "en" ? "bg-white/15 border-white/30 text-white" : "border-white/15 text-slate-300"
        )}
        onClick={() => setLang("en")}
      >
        EN
      </button>
      <button
        type="button"
        className={cn(
          "rounded-lg px-2.5 py-1.5 border text-[11px] min-h-8",
          locale === "zh-Hant" ? "bg-white/15 border-white/30 text-white" : "border-white/15 text-slate-300"
        )}
        onClick={() => setLang("zh-Hant")}
      >
        繁中
      </button>
    </div>
  );

  const nav = (
    <>
      <div className="pr-8 lg:pr-0">
        <Link href="/admin" className="inline-flex" onClick={() => setOpen(false)}>
          <VantageLogo inverted showWordmark markClassName="h-10 w-10" />
        </Link>
        <div className="mt-2 text-xs text-slate-300">{copy.brandSub}</div>
      </div>

      <nav className="flex flex-col gap-0.5 flex-1 overflow-y-auto overscroll-contain pr-1 -mx-1 px-1">
        {NAV_GROUPS.map((group) => {
          const items = NAV_ITEMS.filter((item) => item.group === group.id && can(item.permission));
          if (!items.length) return null;
          return (
            <div
              key={group.id}
              className="mb-1 mt-1 border-t border-white/15 pt-2 first:mt-0 first:border-t-0 first:pt-0"
            >
              <div className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-teal-200/90">
                {locale === "zh-Hant" ? group["zh-Hant"] : group.en}
              </div>
              {items.map((item) => {
                const active =
                  item.href === "/admin/alerts"
                    ? pathname.startsWith("/admin/alerts") || pathname.startsWith("/admin/ai-analyses")
                    : item.href === "/admin/departments"
                      ? pathname.startsWith("/admin/departments") || pathname.startsWith("/admin/teams")
                      : pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
                const Icon = item.icon;
                const effective = (totals[item.href] || 0) + (extra[item.href] || 0);
                const viewed = seen[item.href] ?? 0;
                const unread = Math.max(0, effective - viewed);
                const showBadge = unread > 0 && !navKey(item.href, pathname);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition min-h-10",
                      active ? "bg-white/12 text-white" : "text-slate-300 hover:bg-white/8 hover:text-white"
                    )}
                  >
                    <Icon size={16} className="shrink-0" />
                    <span className="leading-snug flex-1">{navLabel(item.href, locale, item.label)}</span>
                    {showBadge ? (
                      <span
                        className="ml-auto shrink-0 min-w-5 h-5 px-1.5 rounded-full bg-rose-500 text-[10px] font-semibold text-white inline-flex items-center justify-center tabular-nums"
                        aria-label={`${unread} ${copy.unread}`}
                      >
                        {unread > 99 ? "99+" : unread}
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs shrink-0">
        <div className="font-semibold text-white">{sessionUser.name}</div>
        <div className="mt-0.5 text-slate-300 break-all">{sessionUser.email}</div>
        <div className="mt-2 flex flex-wrap gap-1">
          <span className="badge border-teal-400/30 bg-teal-400/10 text-teal-100">{sessionUser.role_code}</span>
          {sessionUser.role_code === "PUBLIC_GUEST" && (
            <span className="badge border-amber-400/30 bg-amber-400/10 text-amber-100">{copy.publicMode}</span>
          )}
          {sessionUser.department_code && (
            <span className="badge border-white/20 bg-white/10 text-slate-100">{sessionUser.department_code}</span>
          )}
        </div>
        <div className="mt-2 text-[10px] text-slate-400">{ownerLine(locale)}</div>
        <div className="mt-3">{langToggle}</div>
        {sessionUser.role_code === "PUBLIC_GUEST" ? (
          <div className="mt-3 space-y-1">
            <button
              type="button"
              onClick={signInHere}
              className="inline-flex items-center gap-1.5 text-slate-300 hover:text-white min-h-10"
            >
              <LogIn size={14} /> {copy.signIn}
            </button>
            <a href={loginHref()} className="block text-[11px] text-slate-400 hover:text-white min-h-8">
              {locale === "zh-Hant" ? "其他角色…" : "Other roles…"}
            </a>
          </div>
        ) : (
          <button
            onClick={logout}
            className="mt-3 inline-flex items-center gap-1.5 text-slate-300 hover:text-white min-h-10"
          >
            <LogOut size={14} /> {copy.signOut}
          </button>
        )}
      </div>
    </>
  );

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="hidden lg:flex bg-[var(--sidebar)] text-[var(--sidebar-ink)] px-4 py-5 flex-col gap-5 sticky top-0 h-screen pt-[max(1.25rem,var(--safe-top))]">
        {nav}
      </aside>

      {open && (
        <div className="lg:hidden fixed inset-0 z-50">
          <button
            type="button"
            className="absolute inset-0 bg-black/45"
            aria-label={copy.menu}
            onClick={() => setOpen(false)}
          />
          <aside className="relative z-50 h-full w-[min(92vw,340px)] max-w-full bg-[var(--sidebar)] text-[var(--sidebar-ink)] px-4 py-5 flex flex-col gap-5 shadow-xl overflow-hidden pt-[max(1.25rem,var(--safe-top))] pb-[max(1rem,var(--safe-bottom))]">
            <button
              type="button"
              className="absolute right-3 top-[max(0.75rem,var(--safe-top))] text-slate-200 min-h-11 min-w-11 inline-flex items-center justify-center rounded-lg hover:bg-white/10"
              aria-label={copy.menu}
              onClick={() => setOpen(false)}
            >
              <X size={20} />
            </button>
            {nav}
          </aside>
        </div>
      )}

      <main className="min-w-0 flex flex-col">
        <header className="border-b border-[var(--line)] bg-white/90 backdrop-blur px-3 sm:px-6 py-2.5 sm:py-3 sticky top-0 z-30 pt-[max(0.65rem,var(--safe-top))]">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="lg:hidden">
                <button
                  type="button"
                  className="btn px-2.5 py-2"
                  aria-label={copy.menu}
                  aria-expanded={open}
                  onClick={() => setOpen(true)}
                >
                  <Menu size={18} />
                </button>
              </div>
              <div className="min-w-0">
                <Link href="/admin" className="flex items-center gap-2 min-w-0">
                  <VantageLogo markClassName="h-8 w-8" showWordmark={false} />
                  <div className="min-w-0">
                    <div className="text-[10px] sm:text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
                      {copy.headerEyebrow}
                    </div>
                    <div className="font-[family-name:var(--font-display)] text-sm sm:text-base text-[var(--ink)] truncate">
                      {copy.headerTitle}
                    </div>
                  </div>
                </Link>
                {sessionUser.role_code === "PUBLIC_GUEST" && (
                  <div className="text-[10px] sm:text-xs text-teal-800">{copy.publicMode}</div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <div className="hidden sm:block text-right text-[11px] sm:text-xs text-[var(--muted)]">
                <div>
                  {copy.messenger}: <strong className="text-[var(--ink)]">Lark</strong>
                </div>
                <div>
                  {copy.indicators}: <strong className="text-[var(--ink)]">Monitor 2.0</strong>
                </div>
              </div>
              <div className="lg:hidden flex gap-1">
                <button
                  type="button"
                  className={cn("btn !min-h-9 !px-2 text-[11px]", locale === "en" ? "btn-primary" : "")}
                  onClick={() => setLang("en")}
                >
                  EN
                </button>
                <button
                  type="button"
                  className={cn("btn !min-h-9 !px-2 text-[11px]", locale === "zh-Hant" ? "btn-primary" : "")}
                  onClick={() => setLang("zh-Hant")}
                >
                  繁中
                </button>
              </div>
            </div>
          </div>
        </header>
        <div className="p-3 sm:p-6 pb-[max(1rem,var(--safe-bottom))] flex-1 min-w-0 max-w-full overflow-x-clip">
          {children}
        </div>
        <SelectionChatbot />
      </main>
    </div>
  );
}
