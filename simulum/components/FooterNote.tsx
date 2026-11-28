"use client";

import { useI18n } from "@/lib/i18n/context";

export function FooterNote() {
  const { t } = useI18n();
  return (
    <footer className="relative border-t border-line px-4 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-center font-mono text-[11px] uppercase tracking-[0.14em] text-mist sm:px-6">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-signal/30 to-transparent" />
      {t("footer.note")}
    </footer>
  );
}
