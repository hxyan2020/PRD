import { useEffect, useState } from "react";
import { useI18n } from "./I18n.jsx";
import { fetchLyrics } from "./lyrics.js";

function sourceLabel(source, t) {
  if (source === "lrclib") return t("lyricsSourceLrclib");
  if (source === "ovh") return t("lyricsSourceOvh");
  return source || "";
}

export default function LyricsPanel({ track }) {
  const { t } = useI18n();
  const [state, setState] = useState({ status: "loading", text: "", source: "" });

  useEffect(() => {
    let cancelled = false;
    setState({ status: "loading", text: "", source: "" });
    fetchLyrics(track).then((result) => {
      if (!cancelled) setState(result);
    });
    return () => {
      cancelled = true;
    };
  }, [track?.id, track?.name, track?.singer, track?.band, track?.composer]);

  const source = sourceLabel(state.source, t);

  return (
    <section className="lyrics" aria-live="polite">
      <h3>{t("lyrics")}</h3>
      {state.status === "loading" ? <p className="lyrics-status">{t("lyricsLoading")}</p> : null}
      {state.status === "missing" ? <p className="lyrics-status">{t("lyricsMissing")}</p> : null}
      {state.status === "instrumental" ? <p className="lyrics-status">{t("lyricsInstrumental")}</p> : null}
      {state.status === "ok" ? (
        <>
          <pre className="lyrics-text">{state.text}</pre>
          {source ? <p className="lyrics-source">{t("lyricsSource", { source })}</p> : null}
        </>
      ) : null}
    </section>
  );
}
