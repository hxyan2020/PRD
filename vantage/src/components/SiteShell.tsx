"use client";

import { useLocale } from "@/lib/i18n/LocaleProvider";
import { LanguageToggle } from "./LanguageToggle";
import { NavLinks } from "./NavLinks";

export function SiteShell({ children }: { children: React.ReactNode }) {
  const { t } = useLocale();

  return (
    <div className="min-h-full">
      <header className="sticky top-0 z-20 border-b border-line bg-panel/95 pt-[max(0.5rem,env(safe-area-inset-top))] backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-2.5 px-4 py-2.5 md:gap-5 md:px-5 md:py-6">
          <div className="flex items-center justify-between gap-3 md:items-end">
            <div className="min-w-0">
              <p className="hidden font-mono text-[11px] tracking-[0.28em] text-gold uppercase md:block">
                {t("brandKicker")}
              </p>
              <h1 className="truncate font-serif text-xl leading-tight text-paper sm:text-3xl md:text-4xl">
                {t("brandTitle")}
              </h1>
              <p className="mt-1 hidden max-w-2xl text-sm text-muted md:block">{t("brandLede")}</p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-2">
              <LanguageToggle />
              <p className="hidden font-mono text-[11px] text-muted md:block">{t("scanHint")}</p>
            </div>
          </div>
          <NavLinks />
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-4 md:px-5 md:py-8">
        {children}
      </main>
      <footer className="border-t border-line pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto max-w-6xl px-4 py-4 text-xs text-muted md:px-5 md:py-6">{t("footer")}</div>
      </footer>
    </div>
  );
}
