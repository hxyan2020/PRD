"use client";

import type { ReactNode } from "react";
import { useUiLocale } from "@/hooks/useUiLocale";

export function EnZh({ en, zh }: { en: ReactNode; zh: ReactNode }) {
  const { locale } = useUiLocale();
  return <>{locale === "zh-Hant" ? zh : en}</>;
}
