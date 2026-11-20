"use client";

import { useLocale } from "@/lib/i18n/LocaleProvider";
import { useStoryText } from "@/lib/i18n/useStoryText";

export function StoryLine({
  english,
  chinese,
}: {
  english: string;
  chinese?: string;
}) {
  const { locale, t } = useLocale();
  const { text, pending } = useStoryText(locale, english, chinese);
  return (
    <>
      {text}
      {pending ? <span className="ml-2 font-mono text-[11px] text-muted">{t("translating")}</span> : null}
    </>
  );
}
