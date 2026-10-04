"use client";

import { useUiLocale } from "@/hooks/useUiLocale";
import { phrase } from "@/lib/i18n";

/** Locale-aware seed / operational copy. Unknown English is left as-is. */
export function Phrase({ children }: { children: string | null | undefined }) {
  const { locale } = useUiLocale();
  return <>{phrase(children, locale)}</>;
}
