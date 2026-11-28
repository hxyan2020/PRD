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
    <header className="safe-top sticky top-0 z-30 border-b border-line/60 bg-paper/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2.5 sm:px-6 sm:py-3">
        <Link href="/" className="group flex min-w-0 items-baseline gap-2">
          <span className="font-display text-xl tracking-tight text-ink sm:text-2xl">
            SIMULUM
          </span>
          <span className="hidden font-mono text-[10px] uppercase tracking-[0.2em] text-mist sm:inline">
            {t("brand.tag")}
          </span>
        </Link>

        <div className="flex items-center gap-2 sm:gap-2.5">
          <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
            {links.map((link) => {
              const active =
                link.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`touch-target inline-flex items-center rounded-md px-3 py-2 text-sm transition ${
                    active
                      ? "bg-signal-soft/70 text-ink"
                      : "text-ink-soft hover:bg-signal-soft/60 hover:text-ink"
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
            className="touch-target inline-flex items-center justify-center rounded-md border border-line/70 bg-paper/80 px-3.5 text-ink md:hidden"
            aria-expanded={menuOpen}
            aria-controls={menuId}
            aria-label={menuOpen ? t("nav.close") : t("nav.menu")}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span className="flex w-5 flex-col gap-1" aria-hidden>
              <span
                className={`block h-0.5 w-full bg-ink transition ${
                  menuOpen ? "translate-y-1.5 rotate-45" : ""
                }`}
              />
              <span
                className={`block h-0.5 w-full bg-ink transition ${
                  menuOpen ? "opacity-0" : ""
                }`}
              />
              <span
                className={`block h-0.5 w-full bg-ink transition ${
                  menuOpen ? "-translate-y-1.5 -rotate-45" : ""
                }`}
              />
            </span>
          </button>
        </div>
      </div>

      <div
        id={menuId}
        className={`border-t border-line/60 bg-paper/95 md:hidden ${
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
                className={`touch-target flex items-center rounded-md px-3 py-3 text-base transition ${
                  active
                    ? "bg-signal-soft/70 text-ink"
                    : "text-ink-soft hover:bg-signal-soft/50 hover:text-ink"
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
