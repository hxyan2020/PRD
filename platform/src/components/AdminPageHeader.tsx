import type { ReactNode } from "react";
import { PageHeader } from "@/components/ui";
import { pageMeta } from "@/lib/i18n";
import { getUiLocale } from "@/lib/i18n-server";

/** Server PageHeader that follows the EN / 繁中 UI locale cookie. */
export async function AdminPageHeader({
  pageKey,
  actions,
}: {
  pageKey: string;
  actions?: ReactNode;
}) {
  const locale = await getUiLocale();
  const meta = pageMeta(pageKey, locale);
  return <PageHeader title={meta.title} subtitle={meta.subtitle} actions={actions} />;
}
