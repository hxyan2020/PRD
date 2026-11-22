"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/context";

export function SiteHeader() {
  const { t, locale, setLocale } = useI18n();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const links = [
    { href: "/", label: t("nav.home") },
    { href: "/knowledge", label: t("nav.knowledge") },
    { href: "/repository", label: t("nav.repository") },
    { href: "/testing", label: t("nav.testing") },
  ];

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-foam/85 backdrop-blur-md safe-top">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3.5 sm:px-6 sm:py-4">
        <Link href="/" className="group min-w-0 flex-1 animate-rise">
          <p className="font-display text-[1.65rem] leading-none tracking-tight text-navy sm:text-4xl">
            {t("brand.name")}
          </p>
          <p className="mt-1 truncate text-[11px] uppercase tracking-[0.16em] text-mist transition group-hover:text-teal sm:text-xs">
            {t("brand.tagline")}
          </p>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => {
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-md px-3 py-1.5 text-sm transition ${
                  active
                    ? "bg-navy text-foam"
                    : "text-navy-2 hover:bg-slate/70 hover:text-navy"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
          <button
            type="button"
            className="ml-1 rounded-md border border-line bg-white px-3 py-1.5 text-sm text-navy hover:border-teal"
            onClick={() => setLocale(locale === "en" ? "zh-CN" : "en")}
          >
            {t("nav.lang")}
          </button>
        </nav>

        <div className="flex items-center gap-2 md:hidden">
          <button
            type="button"
            className="touch-target rounded-md border border-line bg-white px-2.5 text-sm text-navy"
            onClick={() => setLocale(locale === "en" ? "zh-CN" : "en")}
            aria-label={t("nav.lang")}
          >
            {t("nav.lang")}
          </button>
          <button
            type="button"
            className="touch-target inline-flex items-center justify-center rounded-md border border-line bg-white text-navy"
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            <span className="sr-only">Menu</span>
            <span className="flex w-5 flex-col gap-1.5">
              <span className={`h-0.5 w-full bg-navy transition ${open ? "translate-y-2 rotate-45" : ""}`} />
              <span className={`h-0.5 w-full bg-navy transition ${open ? "opacity-0" : ""}`} />
              <span className={`h-0.5 w-full bg-navy transition ${open ? "-translate-y-2 -rotate-45" : ""}`} />
            </span>
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-line bg-foam px-4 py-3 md:hidden">
          <nav className="flex flex-col gap-1">
            {links.map((l) => {
              const active = pathname === l.href;
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`touch-target rounded-md px-3 text-base ${
                    active ? "bg-navy text-foam" : "text-navy hover:bg-slate/60"
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}
