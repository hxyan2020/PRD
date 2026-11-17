"use client";

import { useUiLocale } from "@/hooks/useUiLocale";
import { actionLabel } from "@/lib/i18n";

export function ActionLabel({ href }: { href: string }) {
  const { locale } = useUiLocale();
  return <>{actionLabel(href, locale)}</>;
}
