"use client";

import { useEffect, useState } from "react";
import { looksChinese, type Locale } from "./locale";
import { requestZh } from "./clientTranslate";

export function useStoryText(
  locale: Locale,
  english: string,
  storedZh?: string,
): { text: string; pending: boolean } {
  const [liveZh, setLiveZh] = useState(storedZh ?? "");

  useEffect(() => {
    setLiveZh(storedZh ?? "");
  }, [english, storedZh]);

  useEffect(() => {
    if (locale !== "zh") return;
    if (storedZh || looksChinese(english) || !english.trim()) return;
    let cancelled = false;
    requestZh(english).then((translated) => {
      if (!cancelled && translated) setLiveZh(translated);
    });
    return () => {
      cancelled = true;
    };
  }, [locale, english, storedZh]);

  if (locale !== "zh") {
    return { text: english, pending: false };
  }
  const text = liveZh || storedZh || english;
  return { text, pending: text === english && !looksChinese(english) && Boolean(english) };
}
