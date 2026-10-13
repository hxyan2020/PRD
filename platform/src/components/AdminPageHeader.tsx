"use client";

import type { ReactNode } from "react";
import { PageHeader } from "@/components/ui";
import { pageMeta } from "@/lib/i18n";
import { useUiLocale } from "@/hooks/useUiLocale";

/** PageHeader that follows the EN / 繁中 cookie — including on the GitHub Pages snapshot. */
export function AdminPageHeader({
  pageKey,
  actions,
}: {
  pageKey: string;
  actions?: ReactNode;
}) {
  const { locale } = useUiLocale();
  const meta = pageMeta(pageKey, locale);
  return <PageHeader title={meta.title} subtitle={meta.subtitle} actions={actions} />;
}
