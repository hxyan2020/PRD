import { useEffect, useState } from "react";
import { useI18n } from "./I18n.jsx";
import { lyricsNeedTranslation, translateProse } from "./lyrics-translate.js";

/**
 * Show catalog prose (anecdote / why-shortlisted) in the active UI locale.
 * Falls back to the original English while translating or if the API fails.
 */
export default function TranslatedProse({ text, as: Tag = "p", className = "" }) {
  const { locale } = useI18n();
  const original = String(text || "").trim();
  const [display, setDisplay] = useState(original);

  useEffect(() => {
    if (!original) {
      setDisplay("");
      return undefined;
    }
    if (!lyricsNeedTranslation(original, locale)) {
      setDisplay(original);
      return undefined;
    }
    let cancelled = false;
    setDisplay(original);
    translateProse(original, locale)
      .then((result) => {
        if (cancelled) return;
        const next = String(result?.translated || "").trim();
        if (next) setDisplay(next);
      })
      .catch(() => {
        if (!cancelled) setDisplay(original);
      });
    return () => {
      cancelled = true;
    };
  }, [original, locale]);

  if (!original) return null;
  return <Tag className={className}>{display}</Tag>;
}
