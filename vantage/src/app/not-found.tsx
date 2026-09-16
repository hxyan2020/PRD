"use client";

import { useLocale } from "@/lib/i18n/LocaleProvider";

export default function NotFound() {
  const { t } = useLocale();
  return (
    <div className="rounded-xl border border-dashed border-line px-4 py-10 text-center">
      <p className="font-serif text-2xl">{t("notFound")}</p>
      <p className="mt-2 text-sm text-muted">
        {t("notFoundHint")}
        <a className="mx-1 text-gold underline decoration-gold/30" href="./">
          {t("backHome")}
        </a>
        .
      </p>
    </div>
  );
}
