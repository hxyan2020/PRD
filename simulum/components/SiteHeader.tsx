"use client";

import Link from "next/link";
import { LanguageMenu } from "@/components/LanguageSwitcher";
import { useI18n } from "@/lib/i18n/context";

export function SiteHeader() {
  const { t } = useI18n();
  const links = [
    { href: "/", label: t("nav.home") },
    { href: "/evidence", label: t("nav.evidence") },
    { href: "/categories", label: t("nav.categories") },
    { href: "/scan-log", label: t("nav.scanLog") },
  ];

  return (
    <header className="safe-top relative z-20 border-b border-line/60 bg-paper/70 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link href="/" className="group flex items-baseline gap-2">
          <span className="font-display text-xl tracking-tight text-ink sm:text-2xl">
            SIMULUM
          </span>
          <span className="hidden font-mono text-[10px] uppercase tracking-[0.2em] text-mist sm:inline">
            {t("brand.tag")}
          </span>
        </Link>
        <div className="flex flex-wrap items-center gap-1 sm:gap-2">
          <nav className="flex flex-wrap items-center gap-0.5 sm:gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="touch-target inline-flex items-center rounded-md px-2.5 py-2 text-xs text-ink-soft transition hover:bg-signal-soft/60 hover:text-ink sm:px-3 sm:text-sm"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <LanguageMenu />
        </div>
      </div>
    </header>
  );
}
