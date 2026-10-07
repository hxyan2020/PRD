import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Footer } from "../components/Footer";
import { OriginCountry } from "../components/OriginCountry";
import { useJournal } from "../hooks/useJournal";
import { useAuth } from "../hooks/useAuth";
import { loadCollection } from "../lib/collection";
import type { JournalEntry, JournalKind } from "../types/journal";
import type { Game } from "../types/game";
import { useI18n } from "../i18n";
import {
  loadContentI18n,
  localizeGame,
  type ContentI18nCatalog,
} from "../lib/localizeContent";

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
  const [gamesById, setGamesById] = useState<Map<string, Game>>(() => new Map());
  const [contentI18n, setContentI18n] = useState<ContentI18nCatalog | null>(null);
  const { t, locale } = useI18n();

  useEffect(() => {
    Promise.all([loadCollection(), loadContentI18n().catch(() => null)])
      .then(([d, i18n]) => {
        setCatalogTotal(d.meta.totalGames);
        setGamesById(new Map(d.games.map((g) => [g.id, g])));
        setContentI18n(i18n);
      })
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

  const localizedDisplay = useMemo(
    () =>
      display.map((entry) => {
        const game = gamesById.get(entry.gameId);
        if (!game) return { ...entry, originCountryKey: entry.originCountry };
        const localized = localizeGame(game, locale, contentI18n);
        return {
          ...entry,
          name: localized.name,
          originCountry: localized.originCountry,
          originCountryKey: localized.originCountryKey ?? game.originCountry,
          category: localized.category,
          image: localized.images[0] ?? entry.image,
        };
      }),
    [display, gamesById, locale, contentI18n],
  );

  if (!isLoggedIn) {
    return (
      <>
        <section className="section" style={{ paddingTop: "2.5rem" }}>
          <div className="container">
            <div className="section-head">
              <h2>{t("journal.title")}</h2>
              <p>{t("journal.subLoggedOut")}</p>
            </div>
            <div className="journal-empty">
              <div className="cta-row">
                <Link className="btn btn-primary" to="/login?next=%2Fjournal">
                  {t("nav.login")}
                </Link>
                <Link className="btn btn-ghost" to="/register?next=%2Fjournal">
                  {t("journal.createAccount")}
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
            <h2>{t("journal.title")}</h2>
            <p>
              {t("journal.subLoggedIn", { email: user?.email ?? "" })}
            </p>
          </div>

          <div className="meta-bar">
            <span>
              {t("journal.collected")} <strong>{counts.collected}</strong>
            </span>
            <span>
              {t("journal.played")} <strong>{counts.played}</strong>
            </span>
            <span>
              {t("journal.inJournal")} <strong>{counts.total}</strong>
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
              {t("journal.all")}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === "collected"}
              className={tab === "collected" ? "active" : undefined}
              onClick={() => setTab("collected")}
            >
              {t("journal.tabCollected")}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === "played"}
              className={tab === "played" ? "active" : undefined}
              onClick={() => setTab("played")}
            >
              {t("journal.tabPlayed")}
            </button>
          </div>

          {localizedDisplay.length === 0 ? (
            <div className="journal-empty">
              <p>{t("journal.empty")}</p>
              <p style={{ color: "var(--mist-dim)" }}>{t("journal.emptyHint")}</p>
              <Link className="btn btn-primary" to="/collection">
                {t("journal.browse")}
              </Link>
            </div>
          ) : (
            <ul className="journal-list">
              {localizedDisplay.map((entry) => (
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
                      <div className="meta">
                        <OriginCountry
                          country={entry.originCountry}
                          countryKey={entry.originCountryKey}
                        />
                      </div>
                      <div className="journal-badges">
                        {entry.collectedAt ? (
                          <span className="badge collect">
                            {t("journal.badgeCollected", {
                              when: formatWhen(entry.collectedAt),
                            })}
                          </span>
                        ) : null}
                        {entry.playedAt ? (
                          <span className="badge played">
                            {t("journal.badgePlayed", {
                              when: formatWhen(entry.playedAt),
                            })}
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
                        {t("journal.removeCollect")}
                      </button>
                    ) : null}
                    {entry.playedAt ? (
                      <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={() => remove(entry.gameId, "played")}
                      >
                        {t("journal.removePlayed")}
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
