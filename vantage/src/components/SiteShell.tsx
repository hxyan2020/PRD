"use client";

import { useLocale } from "@/lib/i18n/LocaleProvider";
import { LanguageToggle } from "./LanguageToggle";
import { NavLinks } from "./NavLinks";

export function SiteShell({ children }: { children: React.ReactNode }) {
  const { t } = useLocale();

  return (
    <div className="min-h-full">
      <header className="border-b border-line bg-panel">
        <div className="mx-auto flex max-w-6xl flex-col gap-5 px-5 py-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="font-mono text-[11px] tracking-[0.28em] text-gold uppercase">
                {t("brandKicker")}
              </p>
              <h1 className="font-serif text-3xl leading-tight text-paper md:text-4xl">
                {t("brandTitle")}
              </h1>
              <p className="mt-1 max-w-2xl text-sm text-muted">{t("brandLede")}</p>
            </div>
            <div className="flex flex-col items-start gap-3 md:items-end">
              <LanguageToggle />
              <p className="font-mono text-[11px] text-muted">{t("scanHint")}</p>
            </div>
          </div>
          <NavLinks />
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-8">{children}</main>
      <footer className="border-t border-line">
        <div className="mx-auto max-w-6xl px-5 py-6 text-xs text-muted">{t("footer")}</div>
      </footer>
    </div>
  );
}
