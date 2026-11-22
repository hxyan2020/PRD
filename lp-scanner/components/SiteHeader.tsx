"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n/context";

export function SiteHeader() {
  const { t, locale, setLocale } = useI18n();
  const pathname = usePathname();
  const links = [
    { href: "/", label: t("nav.home") },
    { href: "/knowledge", label: t("nav.knowledge") },
    { href: "/repository", label: t("nav.repository") },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-foam/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="group min-w-0">
          <p className="font-display text-2xl tracking-tight text-navy sm:text-3xl">
            {t("brand.name")}
          </p>
          <p className="truncate text-xs text-mist group-hover:text-teal">{t("brand.tagline")}</p>
        </Link>
        <nav className="flex flex-wrap items-center gap-1 sm:gap-2">
          {links.map((l) => {
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-lg px-3 py-1.5 text-sm transition ${
                  active ? "bg-navy text-foam" : "text-navy-2 hover:bg-slate/70"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
          <button
            type="button"
            className="ml-1 rounded-lg border border-line bg-white px-3 py-1.5 text-sm text-navy hover:border-teal"
            onClick={() => setLocale(locale === "en" ? "zh-CN" : "en")}
          >
            {t("nav.lang")}
          </button>
        </nav>
      </div>
    </header>
  );
}
