import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { loadCollection } from "../lib/collection";
import type { Game } from "../types/game";
import { Footer } from "../components/Footer";
import { JournalActions } from "../components/JournalActions";
import { PlatformLogo } from "../components/PlatformLogo";
import { OriginCountry } from "../components/OriginCountry";
import { GameImage } from "../components/GameImage";
import { useI18n } from "../i18n";
import { loadContentI18n, localizeGame } from "../lib/localizeContent";
import {
  isLudusCardSrc,
  ludusCardDataUri,
  resolveImageSrc,
} from "../lib/gameCardImage";

export function GameDetailPage() {
  const { slug } = useParams();
  const [game, setGame] = useState<Game | null | undefined>(undefined);
  const [activeImg, setActiveImg] = useState(0);
  const [total, setTotal] = useState<number>();
  const { t, locale } = useI18n();

  useEffect(() => {
    let alive = true;
    Promise.all([loadCollection(), loadContentI18n().catch(() => null)]).then(
      ([data, catalog]) => {
        if (!alive) return;
        setTotal(data.meta.totalGames);
        const found = data.games.find((g) => g.slug === slug) ?? null;
        setGame(found ? localizeGame(found, locale, catalog) : null);
        setActiveImg(0);
      },
    );
    return () => {
      alive = false;
    };
  }, [slug, locale]);

  if (game === undefined) {
    return <div className="loading">{t("detail.loading")}</div>;
  }

  if (!game) {
    return (
      <div className="error">
        <div>
          <p>{t("detail.notFound")}</p>
          <Link className="btn btn-primary" to="/collection">
            {t("detail.back")}
          </Link>
        </div>
      </div>
    );
  }

  const activeSrc = game.images[activeImg] ?? game.images[0];
  const shot = isLudusCardSrc(activeSrc)
    ? ludusCardDataUri(game.name, game.category, game.originCountry)
    : resolveImageSrc(activeSrc);

  return (
    <>
      <section className="detail-hero">
        <div
          className="detail-hero-media"
          style={{ backgroundImage: `url("${shot}")` }}
          aria-hidden="true"
        />
        <div className="container">
          <div className="pill">{game.category}</div>
          <h1>{game.name}</h1>
          <div className="detail-facts">
            <span>
              <strong style={{ color: "var(--mist)" }}>{t("detail.origin")}</strong>{" "}
              <OriginCountry
                country={game.originCountry}
                countryKey={game.originCountryKey}
              />
            </span>
            <span>
              <strong style={{ color: "var(--mist)" }}>
                {t("detail.civilization")}
              </strong>{" "}
              {game.civilization}
            </span>
            <span>
              <strong style={{ color: "var(--mist)" }}>{t("detail.created")}</strong>{" "}
              {game.creationYear}
            </span>
            <span>
              <strong style={{ color: "var(--mist)" }}>{t("detail.players")}</strong>{" "}
              {game.idealParticipants}
            </span>
          </div>
          <div className="detail-journal">
            <JournalActions game={game} />
            <Link className="journal-link" to="/journal">
              {t("detail.openJournal")}
            </Link>
          </div>
        </div>
      </section>

      <div className="container detail-layout">
        <div>
          <div className="panel">
            <h2>{t("detail.about")}</h2>
            <p style={{ color: "var(--mist-dim)" }}>{game.description}</p>
          </div>

          <div className="panel">
            <h2>{t("detail.howToPlay")}</h2>
            <ol>
              {game.howToPlay.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </div>

          {game.variations.length > 0 ? (
            <div className="panel">
              <h2>{t("detail.variations")}</h2>
              <p style={{ color: "var(--mist-dim)" }}>{t("detail.variationsIntro")}</p>
              <div className="variations">
                {game.variations.map((v) => (
                  <article className="variation" key={`${v.name}-${v.originCountry}`}>
                    {v.images?.[0] ? (
                      <div className="variation-media">
                        <GameImage
                          src={v.images[0]}
                          alt={v.name}
                          loading="lazy"
                          label={{
                            name: v.name,
                            category: game.category,
                            originCountry: v.originCountry,
                          }}
                        />
                        {v.images.length > 1 ? (
                          <div className="variation-thumbs">
                            {v.images.slice(1, 4).map((src) => (
                              <GameImage
                                key={src}
                                src={src}
                                alt=""
                                loading="lazy"
                                label={{
                                  name: v.name,
                                  category: game.category,
                                  originCountry: v.originCountry,
                                }}
                              />
                            ))}
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                    <h3>{v.name}</h3>
                    <div className="meta">
                      <OriginCountry
                        country={v.originCountry}
                        countryKey={v.originCountryKey}
                      />{" "}
                      · {v.creationYear}
                    </div>
                    <p>{v.notes}</p>
                  </article>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <aside>
          <div className="panel">
            <h2>{t("detail.images")}</h2>
            <GameImage
              className="main-shot"
              src={activeSrc}
              alt={`${game.name} reference`}
              label={{
                name: game.name,
                category: game.category,
                originCountry: game.originCountry,
              }}
            />
            <div className="gallery">
              {game.images.map((src, i) => (
                <button
                  type="button"
                  key={`${src}-${i}`}
                  className={i === activeImg ? "active" : undefined}
                  onClick={() => setActiveImg(i)}
                  aria-label={t("detail.showImage", { n: i + 1 })}
                >
                  <GameImage
                    src={src}
                    alt=""
                    loading="lazy"
                    label={{
                      name: game.name,
                      category: game.category,
                      originCountry: game.originCountry,
                    }}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="panel">
            <h2>{t("detail.requirements")}</h2>
            <ul>
              {game.requirements.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </div>

          <div className="panel">
            <h2>{t("detail.idealParticipants")}</h2>
            <p style={{ color: "var(--mist-dim)", margin: 0 }}>
              {game.idealParticipants}
            </p>
          </div>

          <div className="panel">
            <h2>{t("detail.whereToBuy")}</h2>
            <p style={{ color: "var(--mist-dim)", fontSize: "0.92rem" }}>
              {t("detail.buyIntro")}
            </p>
            <ul className="buy-list">
              {game.purchaseLinks.map((link) => (
                <li key={link.url}>
                  <a href={link.url} target="_blank" rel="noreferrer noopener">
                    <span className="buy-link-main">
                      <PlatformLogo platform={link.platform} />
                      <span className="buy-link-text">
                        <span className="platform">{link.platform}</span>
                        <span className="buy-label">{link.label}</span>
                      </span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <Link className="btn btn-ghost" to="/collection">
            {t("detail.back")}
          </Link>
        </aside>
      </div>
      <Footer total={total} />
    </>
  );
}
