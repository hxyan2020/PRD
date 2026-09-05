import { useI18n } from "./I18n.jsx";
import { formatLoggedAt } from "./recommendLog.js";

function kindLabel(entry, translate) {
  if (entry.mode === "surprise") return translate("logSurprise");
  if (entry.mode === "beyond" || entry.kind === "beyond") return translate("logBeyond");
  if (entry.kind === "popular") return translate("logDailyPopular");
  if (entry.kind === "ai") return translate("logDailyMatched");
  return translate("logDaily");
}

export default function RecommendLog({ log, tracks, onOpen }) {
  const { locale, t } = useI18n();
  const entries = log?.entries || [];

  return (
    <section className="recommend-log" id="recommend-log" aria-label={t("recommendLog")}>
      <div className="collections-head">
        <p className="eyebrow">{t("history")}</p>
        <h2>{t("recommendLog")}</h2>
        <p>{entries.length ? t("logCount", { n: entries.length }) : t("logEmpty")}</p>
      </div>
      {entries.length > 0 && (
        <ol className="log-list">
          {entries.map((entry) => {
            const track = tracks.find((item) => item.id === entry.trackId);
            const prefs = [entry.mood, entry.country, entry.genre].filter(Boolean).join(" · ");
            const stamped = formatLoggedAt(entry.at, locale);
            return (
              <li key={entry.id} className="log-row">
                {entry.coverUrl ? (
                  <img src={entry.coverUrl} alt="" />
                ) : (
                  <span className="log-cover-fallback" aria-hidden="true" />
                )}
                <div>
                  <time dateTime={entry.at}>
                    {stamped === "Date not recorded" ? t("dateNotRecorded") : stamped}
                  </time>
                  <p className="log-title">{entry.name}</p>
                  <p className="log-meta">
                    {entry.artist}
                    {entry.artist ? " · " : ""}
                    {kindLabel(entry, t)}
                    {prefs ? ` · ${prefs}` : ""}
                  </p>
                </div>
                {track ? (
                  <button type="button" onClick={() => onOpen(track, true)}>
                    {t("listen")}
                  </button>
                ) : null}
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
