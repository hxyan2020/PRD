import { useEffect, useState } from "react";
import { useI18n } from "./I18n.jsx";
import { languageMeta } from "./i18n.js";
import { fetchLyrics } from "./lyrics.js";
import { lyricsNeedTranslation, splitLyricLines, translateLyricLines } from "./lyrics-translate.js";

function sourceLabel(source, t) {
  if (source === "lrclib") return t("lyricsSourceLrclib");
  if (source === "ovh") return t("lyricsSourceOvh");
  return source || "";
}

export default function LyricsPanel({ track, open = false, onClose, id }) {
  const { locale, t } = useI18n();
  const trackKey = track?.id || "";
  const [state, setState] = useState({ status: "idle", text: "", source: "" });
  const [translation, setTranslation] = useState({ status: "idle", lines: [], translations: null });

  useEffect(() => {
    if (!open || !trackKey) {
      setState({ status: "idle", text: "", source: "" });
      setTranslation({ status: "idle", lines: [], translations: null });
      return undefined;
    }
    let cancelled = false;
    setState({ status: "loading", text: "", source: "" });
    setTranslation({ status: "idle", lines: [], translations: null });
    fetchLyrics(track).then((result) => {
      if (!cancelled) setState(result);
    });
    return () => {
      cancelled = true;
    };
  }, [open, trackKey, track?.name, track?.singer, track?.band, track?.composer]);

  useEffect(() => {
    if (!open || state.status !== "ok" || !state.text) {
      if (!open) setTranslation({ status: "idle", lines: [], translations: null });
      return undefined;
    }
    const lines = splitLyricLines(state.text);
    if (!lyricsNeedTranslation(state.text, locale)) {
      setTranslation({ status: "same", lines, translations: null });
      return undefined;
    }
    let cancelled = false;
    setTranslation({ status: "loading", lines, translations: null });
    translateLyricLines(state.text, locale)
      .then((result) => {
        if (cancelled) return;
        const hasAny = result.translations?.some((line, index) => {
          const translated = String(line || "").trim();
          return translated && translated !== String(result.lines[index] || "").trim();
        });
        setTranslation({
          status: result.needed ? (hasAny ? "ok" : "failed") : "same",
          lines: result.lines,
          translations: hasAny ? result.translations : null,
        });
      })
      .catch(() => {
        if (!cancelled) setTranslation({ status: "failed", lines, translations: null });
      });
    return () => {
      cancelled = true;
    };
  }, [open, state.status, state.text, locale]);

  if (!open || !trackKey) return null;

  const source = sourceLabel(state.source, t);
  const languageName = languageMeta(locale).native;
  const showPairs = translation.status === "ok" && Array.isArray(translation.translations);

  return (
    <section className="lyrics is-open" id={id} aria-live="polite">
      <div className="lyrics-head">
        <h3>{t("lyrics")}</h3>
        {onClose ? (
          <button type="button" className="lyrics-hide" onClick={onClose}>
            {t("lyricsHide")}
          </button>
        ) : null}
      </div>
      <div className="lyrics-body">
        {state.status === "loading" ? <p className="lyrics-status">{t("lyricsLoading")}</p> : null}
        {state.status === "missing" ? <p className="lyrics-status">{t("lyricsMissing")}</p> : null}
        {state.status === "instrumental" ? <p className="lyrics-status">{t("lyricsInstrumental")}</p> : null}
        {state.status === "ok" ? (
          <>
            {translation.status === "loading" ? (
              <p className="lyrics-status">{t("lyricsTranslating")}</p>
            ) : null}
            {showPairs ? (
              <ol className="lyrics-lines">
                {translation.lines.map((line, index) => (
                  <li key={`${index}-${line.slice(0, 12)}`} className={line.trim() ? "" : "is-blank"}>
                    <p className="lyrics-orig">{line || "\u00a0"}</p>
                    {translation.translations[index] &&
                    translation.translations[index].trim() !== line.trim() ? (
                      <p className="lyrics-tr">{translation.translations[index]}</p>
                    ) : null}
                  </li>
                ))}
              </ol>
            ) : (
              <pre className="lyrics-text">{state.text}</pre>
            )}
            {showPairs ? <p className="lyrics-source">{t("lyricsTranslationNote", { language: languageName })}</p> : null}
            {translation.status === "failed" ? (
              <p className="lyrics-source">{t("lyricsTranslationFailed")}</p>
            ) : null}
            {source ? <p className="lyrics-source">{t("lyricsSource", { source })}</p> : null}
          </>
        ) : null}
      </div>
    </section>
  );
}
