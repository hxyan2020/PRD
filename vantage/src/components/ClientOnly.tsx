"use client";

import { useHasMounted } from "@/lib/queryNav";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import type { ReactNode } from "react";

export function ClientOnly({ children }: { children: ReactNode }) {
  const mounted = useHasMounted();
  const { t } = useLocale();
  if (!mounted) {
    return <p className="text-muted">{t("loading")}</p>;
  }
  return <>{children}</>;
}
