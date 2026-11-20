"use client";

import { useEffect, useState } from "react";
import { isIncompleteZh } from "../extract";
import { detectSourceLang, looksUntranslated } from "./detectLang";
import { type Locale } from "./locale";
import { requestZh } from "./clientTranslate";

function usableZh(source: string, value?: string): string {
  const text = value?.trim() ?? "";
  if (!text || isIncompleteZh(text) || looksUntranslated(source, text)) return "";
  return text;
}

export function useStoryText(
  locale: Locale,
  english: string,
  storedZh?: string,
): { text: string; pending: boolean } {
  const readyZh = usableZh(english, storedZh);
  const [liveZh, setLiveZh] = useState(readyZh);

  useEffect(() => {
    setLiveZh(readyZh);
  }, [english, readyZh]);

  useEffect(() => {
    if (locale !== "zh") return;
    if (readyZh || detectSourceLang(english) === "zh" || !english.trim()) return;
    let cancelled = false;
    requestZh(english).then((translated) => {
      if (!cancelled && usableZh(english, translated)) setLiveZh(translated);
    });
    return () => {
      cancelled = true;
    };
  }, [locale, english, readyZh]);

  if (locale !== "zh") {
    return { text: english, pending: false };
  }
  const text = liveZh || readyZh || english;
  return {
    text,
    pending: text === english && detectSourceLang(english) !== "zh" && Boolean(english),
  };
}
