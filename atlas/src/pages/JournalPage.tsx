import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Footer } from "../components/Footer";
import { useJournal } from "../hooks/useJournal";
import { useAuth } from "../hooks/useAuth";
import { loadCollection } from "../lib/collection";
import type { JournalEntry, JournalKind } from "../types/journal";

function formatWhen(iso?: string) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function sortByRecent(entries: JournalEntry[]) {
  return [...entries].sort((a, b) => {
    const aTime = Math.max(
      a.collectedAt ? Date.parse(a.collectedAt) : 0,
      a.playedAt ? Date.parse(a.playedAt) : 0,
    );
    const bTime = Math.max(
      b.collectedAt ? Date.parse(b.collectedAt) : 0,
      b.playedAt ? Date.parse(b.playedAt) : 0,
    );
    return bTime - aTime;
  });
}

export function JournalPage() {
  const { collected, played, counts, remove } = useJournal();
  const { isLoggedIn, user } = useAuth();
  const [tab, setTab] = useState<"all" | JournalKind>("all");
  const [catalogTotal, setCatalogTotal] = useState<number>();

  useEffect(() => {
    loadCollection()
      .then((d) => setCatalogTotal(d.meta.totalGames))
      .catch(() => undefined);
  }, []);

  const display =
    tab === "collected"
      ? collected
      : tab === "played"
        ? played
        : sortByRecent(
            Object.values(
              Object.fromEntries(
                [...collected, ...played].map((e) => [e.gameId, e]),
              ),
            ),
          );

  if (!isLoggedIn) {
    return (
      <>
        <section className="section" style={{ paddingTop: "2.5rem" }}>
          <div className="container">
            <div className="section-head">
              <h2>Your journal</h2>
              <p>
                Log in to save collected and played games. Your session stays
                active on this device until you log out.
              </p>
            </div>
            <div className="journal-empty">
              <div className="cta-row">
                <Link className="btn btn-primary" to="/login?next=%2Fjournal">
                  Log in
                </Link>
                <Link className="btn btn-ghost" to="/register?next=%2Fjournal">
                  Create account
                </Link>
              </div>
            </div>
          </div>
        </section>
        <Footer total={catalogTotal} />
      </>
    );
  }

  return (
    <>
      <section className="section" style={{ paddingTop: "2.5rem" }}>
        <div className="container">
          <div className="section-head">
            <h2>Your journal</h2>
            <p>
              Signed in as <strong style={{ color: "var(--mist)" }}>{user?.email}</strong>.
              Collected and played games are saved to your account on this device.
            </p>
          </div>

          <div className="meta-bar">
            <span>
              Collected: <strong>{counts.collected}</strong>
            </span>
            <span>
              Played: <strong>{counts.played}</strong>
            </span>
            <span>
              In journal: <strong>{counts.total}</strong>
            </span>
          </div>

          <div className="journal-tabs" role="tablist" aria-label="Journal filters">
            <button
              type="button"
              role="tab"
              aria-selected={tab === "all"}
              className={tab === "all" ? "active" : undefined}
              onClick={() => setTab("all")}
            >
              All
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === "collected"}
              className={tab === "collected" ? "active" : undefined}
              onClick={() => setTab("collected")}
            >
              Collected
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === "played"}
              className={tab === "played" ? "active" : undefined}
              onClick={() => setTab("played")}
            >
              Played
            </button>
          </div>

          {display.length === 0 ? (
            <div className="journal-empty">
              <p>Nothing here yet.</p>
              <p style={{ color: "var(--mist-dim)" }}>
                Open any game and tap Collect or Mark played to add it to your
                journal.
              </p>
              <Link className="btn btn-primary" to="/collection">
                Browse the collection
              </Link>
            </div>
          ) : (
            <ul className="journal-list">
              {display.map((entry) => (
                <li key={entry.gameId} className="journal-item">
                  <Link to={`/game/${entry.slug}`} className="journal-item-main">
                    <div className="journal-thumb">
                      {entry.image ? (
                        <img src={entry.image} alt="" loading="lazy" />
                      ) : null}
                    </div>
                    <div>
                      <div className="pill">{entry.category}</div>
                      <h3>{entry.name}</h3>
                      <div className="meta">{entry.originCountry}</div>
                      <div className="journal-badges">
                        {entry.collectedAt ? (
                          <span className="badge collect">
                            Collected · {formatWhen(entry.collectedAt)}
                          </span>
                        ) : null}
                        {entry.playedAt ? (
                          <span className="badge played">
                            Played · {formatWhen(entry.playedAt)}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </Link>
                  <div className="journal-item-actions">
                    {entry.collectedAt ? (
                      <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={() => remove(entry.gameId, "collected")}
                      >
                        Remove collect
                      </button>
                    ) : null}
                    {entry.playedAt ? (
                      <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={() => remove(entry.gameId, "played")}
                      >
                        Remove played
                      </button>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
      <Footer total={catalogTotal} />
    </>
  );
}
