"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AuthNav } from "@/components/AuthNav";
import { LanguagePicker } from "@/components/LanguagePicker";
import { useI18n } from "@/lib/i18n/context";

export function SiteHeader() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function close() {
    setOpen(false);
  }

  return (
    <header className="sticky top-0 z-30 border-b border-white/8 bg-ink/85 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
        <Link href="/" className="group flex min-w-0 shrink items-baseline gap-2" onClick={close}>
          <span className="font-display text-xl tracking-tight text-foam transition group-hover:text-white sm:text-2xl">
            VentureScan
          </span>
          <span className="hidden font-mono text-[10px] uppercase tracking-[0.2em] text-celadon md:inline">
            live ledger
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <div className="hidden md:flex md:items-center md:gap-3 md:text-sm md:text-mist">
            <NavLinks t={t} />
            <AuthNav />
          </div>
          <LanguagePicker />
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-foam md:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? t("nav.close") : t("nav.menu")}
            onClick={() => setOpen((v) => !v)}
          >
            <span className="sr-only">{open ? t("nav.close") : t("nav.menu")}</span>
            <span aria-hidden className="flex flex-col gap-1.5">
              <span
                className={`block h-0.5 w-4 bg-foam transition ${open ? "translate-y-2 rotate-45" : ""}`}
              />
              <span className={`block h-0.5 w-4 bg-foam transition ${open ? "opacity-0" : ""}`} />
              <span
                className={`block h-0.5 w-4 bg-foam transition ${open ? "-translate-y-2 -rotate-45" : ""}`}
              />
            </span>
          </button>
        </div>
      </div>

      {open ? (
        <div
          id="mobile-nav"
          className="border-t border-white/10 bg-ink-2/95 md:hidden"
        >
          <nav className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-3 text-base text-mist">
            <MobileLink href="/today" onClick={close}>
              {t("nav.today")}
            </MobileLink>
            <MobileLink href="/#ideas" onClick={close}>
              {t("nav.ideas")}
            </MobileLink>
            <MobileLink href="/match" onClick={close}>
              {t("nav.match")}
            </MobileLink>
            <MobileLink href="/methodology" onClick={close}>
              {t("nav.method")}
            </MobileLink>
            <div className="mt-2 flex flex-col gap-2 border-t border-white/10 pt-3">
              <AuthNav stacked />
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}

function NavLinks({ t }: { t: (key: "nav.today" | "nav.ideas" | "nav.match" | "nav.method") => string }) {
  const links = [
    { href: "/today", key: "nav.today" as const },
    { href: "/#ideas", key: "nav.ideas" as const },
    { href: "/match", key: "nav.match" as const },
    { href: "/methodology", key: "nav.method" as const },
  ];
  return (
    <>
      {links.map((link) => (
        <Link key={link.href} href={link.href} className="hover:text-foam">
          {t(link.key)}
        </Link>
      ))}
    </>
  );
}

function MobileLink({
  href,
  onClick,
  children,
}: {
  href: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="rounded-xl px-3 py-3 text-foam hover:bg-white/5"
    >
      {children}
    </Link>
  );
}
