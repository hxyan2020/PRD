import { Link } from "react-router-dom";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { loadCollection, type CollectionData } from "../lib/collection";
import { GameCard } from "../components/GameCard";
import { Footer } from "../components/Footer";
import { useI18n } from "../i18n";
import {
  loadContentI18n,
  localizeGame,
  type ContentI18nCatalog,
} from "../lib/localizeContent";
import { dailyPickGames, todayKey } from "../lib/dailyRotate";

export function HomePage() {
  const [data, setData] = useState<CollectionData | null>(null);
  const [contentI18n, setContentI18n] = useState<ContentI18nCatalog | null>(null);
  const { t, locale } = useI18n();

  useEffect(() => {
    Promise.all([loadCollection(), loadContentI18n().catch(() => null)])
      .then(([d, i18n]) => {
        setData(d);
        setContentI18n(i18n);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    document.title = t("home.docTitle");
  }, [t, locale]);

  const day = todayKey();
  const featured = useMemo(() => {
    if (!data) return [];
    const withVariations = data.games.filter((g) => g.variations.length > 0);
    return dailyPickGames(withVariations, 6, "home-featured", day).map((g) =>
      localizeGame(g, locale, contentI18n),
    );
  }, [data, locale, contentI18n, day]);

  return (
    <>
      <section
        className="hero"
        style={
          {
            "--hero-banner": `url(${import.meta.env.BASE_URL}hero-banner-wide.jpg)`,
          } as CSSProperties
        }
      >
        <div className="hero-media" aria-hidden="true" />
        <div className="container hero-content">
          <p className="hero-brand">
            <img
              className="hero-brand-mark"
              src={`${import.meta.env.BASE_URL}logo-cat.png`}
              alt=""
              width={72}
              height={72}
              aria-hidden="true"
            />
            <span className="hero-brand-wordmark">
              <span>Ludus</span>
              <span>Atlas</span>
            </span>
          </p>
          <h1>{t("home.headline")}</h1>
          <p>{t("home.sub")}</p>
          <div className="cta-row">
            <Link className="btn btn-primary" to="/collection">
              {t("home.ctaBrowse")}
            </Link>
            <Link className="btn btn-ghost" to="/surprise-me">
              {t("home.ctaGuide")}
            </Link>
          </div>
        </div>
      </section>

      <section className="section" id="featured">
        <div className="container">
          <div className="section-head">
            <h2>{t("home.featuredTitle")}</h2>
            <p>{t("home.featuredSub")}</p>
            <p className="daily-day-note">{t("home.featuredDay", { date: day })}</p>
          </div>
          {data ? (
            <>
              <div className="meta-bar">
                <span>
                  {t("home.catalogSize")}{" "}
                  <strong>{data.meta.totalGames.toLocaleString()}</strong>
                </span>
                <span>
                  {t("home.nestedVariations")}{" "}
                  <strong>{data.meta.totalVariations}</strong>
                </span>
                <span>
                  {t("home.categories")}{" "}
                  <strong>{data.meta.categories.length}</strong>
                </span>
              </div>
              <div className="game-grid">
                {featured.map((g, i) => (
                  <GameCard key={g.id} game={g} index={i} />
                ))}
              </div>
              <div className="cta-row" style={{ marginTop: "2rem" }}>
                <Link className="btn btn-primary" to="/collection">
                  {t("home.openAll", { n: data.meta.totalGames.toLocaleString() })}
                </Link>
              </div>
            </>
          ) : (
            <div className="loading">{t("home.loading")}</div>
          )}
        </div>
      </section>
      <Footer total={data?.meta.totalGames} />
    </>
  );
}
