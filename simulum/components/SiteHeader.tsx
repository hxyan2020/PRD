"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { LanguageMenu } from "@/components/LanguageSwitcher";
import { useI18n } from "@/lib/i18n/context";

export function SiteHeader() {
  const { t } = useI18n();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuId = useId();

  const links = [
    { href: "/", label: t("nav.home") },
    { href: "/evidence", label: t("nav.evidence") },
    { href: "/categories", label: t("nav.categories") },
    { href: "/scan-log", label: t("nav.scanLog") },
  ];

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  return (
    <header className="safe-top sticky top-0 z-30 border-b border-line/80 bg-paper/90 backdrop-blur-md">
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-signal/40 to-transparent" />
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2.5 sm:px-6 sm:py-3">
        <Link href="/" className="group flex min-w-0 items-baseline gap-2.5">
          <span className="font-display text-xl font-semibold tracking-[0.06em] text-ink sm:text-2xl">
            SIMULUM
          </span>
          <span className="hidden font-mono text-[10px] uppercase tracking-[0.22em] text-mist sm:inline">
            {t("brand.tag")}
          </span>
        </Link>

        <div className="flex items-center gap-2 sm:gap-2.5">
          <nav className="hidden items-center gap-0.5 md:flex" aria-label="Primary">
            {links.map((link) => {
              const active =
                link.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`touch-target inline-flex items-center border px-3 py-2 font-mono text-[11px] uppercase tracking-[0.14em] transition ${
                    active
                      ? "border-signal/50 bg-signal-soft text-signal"
                      : "border-transparent text-mist hover:border-line hover:text-ink"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <LanguageMenu compact />

          <button
            type="button"
            className="touch-target inline-flex items-center justify-center border border-line bg-panel px-3.5 text-ink md:hidden"
            aria-expanded={menuOpen}
            aria-controls={menuId}
            aria-label={menuOpen ? t("nav.close") : t("nav.menu")}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span className="flex w-5 flex-col gap-1" aria-hidden>
              <span
                className={`block h-0.5 w-full bg-signal transition ${
                  menuOpen ? "translate-y-1.5 rotate-45" : ""
                }`}
              />
              <span
                className={`block h-0.5 w-full bg-signal transition ${
                  menuOpen ? "opacity-0" : ""
                }`}
              />
              <span
                className={`block h-0.5 w-full bg-signal transition ${
                  menuOpen ? "-translate-y-1.5 -rotate-45" : ""
                }`}
              />
            </span>
          </button>
        </div>
      </div>

      <div
        id={menuId}
        className={`border-t border-line bg-panel/95 md:hidden ${
          menuOpen ? "block" : "hidden"
        }`}
      >
        <nav
          className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-3 sm:px-6"
          aria-label="Mobile"
        >
          {links.map((link) => {
            const active =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`touch-target flex items-center border px-3 py-3 font-mono text-sm uppercase tracking-[0.12em] transition ${
                  active
                    ? "border-signal/40 bg-signal-soft text-signal"
                    : "border-transparent text-ink-soft hover:border-line hover:text-ink"
                }`}
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
