"use client";

import { useUiLocale } from "@/hooks/useUiLocale";
import { t } from "@/lib/i18n";

export function T({
  k,
  vars,
}: {
  k: string;
  vars?: Record<string, string | number>;
}) {
  const { locale } = useUiLocale();
  return <>{t(k, locale, vars)}</>;
}
