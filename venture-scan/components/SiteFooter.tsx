"use client";

import { useI18n } from "@/lib/i18n/context";

export function SiteFooter() {
  const { t } = useI18n();
  return (
    <footer className="relative z-10 border-t border-white/8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-mist sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>
          <span className="font-display text-base text-foam">VentureScan</span>
          {" — "}
          {t("footer.tagline")}
        </p>
        <p className="font-mono text-[11px] uppercase tracking-[0.16em]">{t("footer.chips")}</p>
      </div>
    </footer>
  );
}
