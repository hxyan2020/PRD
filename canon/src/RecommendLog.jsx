import { formatLoggedAt } from "./recommendLog.js";

function kindLabel(entry) {
  if (entry.mode === "surprise") return "Surprise";
  if (entry.kind === "popular") return "Daily · most streamed";
  if (entry.kind === "ai") return "Daily · matched";
  return "Daily";
}

export default function RecommendLog({ log, tracks, onOpen }) {
  const entries = log?.entries || [];

  return (
    <section className="recommend-log" id="recommend-log" aria-label="Recommendation log">
      <div className="collections-head">
        <p className="eyebrow">History</p>
        <h2>Recommendation log</h2>
        <p>
          {entries.length
            ? `${entries.length} recommendation${entries.length === 1 ? "" : "s"} with date. Daily picks are stored once per day for the same preferences; every Surprise me is kept.`
            : "Daily picks and Surprise me results will appear here with the date they were made."}
        </p>
      </div>
      {entries.length > 0 && (
        <ol className="log-list">
          {entries.map((entry) => {
            const track = tracks.find((item) => item.id === entry.trackId);
            const prefs = [entry.mood, entry.country, entry.genre].filter(Boolean).join(" · ");
            return (
              <li key={entry.id} className="log-row">
                {entry.coverUrl ? (
                  <img src={entry.coverUrl} alt="" />
                ) : (
                  <span className="log-cover-fallback" aria-hidden="true" />
                )}
                <div>
                  <time dateTime={entry.at}>{formatLoggedAt(entry.at)}</time>
                  <p className="log-title">{entry.name}</p>
                  <p className="log-meta">
                    {entry.artist}
                    {entry.artist ? " · " : ""}
                    {kindLabel(entry)}
                    {prefs ? ` · ${prefs}` : ""}
                  </p>
                </div>
                {track ? (
                  <button type="button" onClick={() => onOpen(track, true)}>
                    Listen
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
