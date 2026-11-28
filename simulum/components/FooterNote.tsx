"use client";

import { useI18n } from "@/lib/i18n/context";

export function FooterNote() {
  const { t } = useI18n();
  return (
    <footer className="relative border-t border-line/70 px-4 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-center text-xs text-mist sm:px-6">
      {t("footer.note")}
    </footer>
  );
}
