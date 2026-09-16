"use client";

import { useLocale } from "@/lib/i18n/LocaleProvider";
import { LanguageToggle } from "./LanguageToggle";
import { NavLinks } from "./NavLinks";

export function SiteShell({ children }: { children: React.ReactNode }) {
  const { t } = useLocale();

  return (
    <div className="min-h-full">
      <header className="sticky top-0 z-20 border-b border-line bg-panel/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 md:gap-5 md:px-5 md:py-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="font-mono text-[11px] tracking-[0.28em] text-gold uppercase">
                {t("brandKicker")}
              </p>
              <h1 className="font-serif text-2xl leading-tight text-paper sm:text-3xl md:text-4xl">
                {t("brandTitle")}
              </h1>
              <p className="mt-1 max-w-2xl text-xs text-muted sm:text-sm">{t("brandLede")}</p>
            </div>
            <div className="flex items-center justify-between gap-3 md:flex-col md:items-end">
              <LanguageToggle />
              <p className="font-mono text-[10px] text-muted sm:text-[11px]">{t("scanHint")}</p>
            </div>
          </div>
          <NavLinks />
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-5 md:px-5 md:py-8">{children}</main>
      <footer className="border-t border-line">
        <div className="mx-auto max-w-6xl px-4 py-5 text-xs text-muted md:px-5 md:py-6">{t("footer")}</div>
      </footer>
    </div>
  );
}
