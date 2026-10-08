import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { loadCollection } from "../lib/collection";
import type { Game } from "../types/game";
import { Footer } from "../components/Footer";
import { JournalActions } from "../components/JournalActions";
import { PlatformLogo } from "../components/PlatformLogo";
import { OriginCountry } from "../components/OriginCountry";
import { GameImage } from "../components/GameImage";
import { GameAssistant } from "../components/GameAssistant";
import { useI18n } from "../i18n";
import { loadContentI18n, localizeGame } from "../lib/localizeContent";
import {
  isFragileRemoteSrc,
  isLudusSyntheticSrc,
  isPhotographicSrc,
  listDisplayImages,
  primaryCoverSrc,
  resolveImageSrc,
  VIEW_CAPTION_KEYS,
  type ImageLabel,
} from "../lib/gameCardImage";

function formatCount(n: number): string {
  if (!Number.isFinite(n) || n < 0) return "0";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}K`;
  return String(Math.round(n));
}

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
        setGame(found ? localizeGame(found, locale, catalog, t) : null);
        setActiveImg(0);
      },
    );
    return () => {
      alive = false;
    };
  }, [slug, locale, t]);

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

  // Real photos only (variable length). No synthetic placeholder panels.
  const galleryImages = listDisplayImages(game.images);
  const activeSrc =
    galleryImages[Math.min(activeImg, Math.max(galleryImages.length - 1, 0))] ??
    primaryCoverSrc(game.images) ??
    game.images[0];
  const imageLabel: ImageLabel = {
    name: game.name,
    category: game.category,
    originCountry: game.originCountry,
    categoryKey: game.categoryKey ?? game.category,
    viewCaptions: VIEW_CAPTION_KEYS.map((key) => t(key)),
    cardFooter: t("detail.cardFooter"),
  };
  // Title-card SVGs repeat the game name — using them as the hero background
  // creates a ghost double of the headline. Prefer a plain brand wash instead.
  const heroPhoto =
    activeSrc &&
    isPhotographicSrc(activeSrc) &&
    !isLudusSyntheticSrc(activeSrc) &&
    !isFragileRemoteSrc(activeSrc) &&
    !activeSrc.startsWith("data:")
      ? resolveImageSrc(activeSrc, imageLabel)
      : "";

  return (
    <>
      <section className="detail-hero">
        <div
          className={`detail-hero-media${heroPhoto ? "" : " detail-hero-media--wash"}`}
          style={heroPhoto ? { backgroundImage: `url("${heroPhoto}")` } : undefined}
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
        <div className="detail-main">
          <div className="panel">
            <h2>{t("detail.about")}</h2>
            <p style={{ color: "var(--mist-dim)" }}>{game.description}</p>
          </div>

          <div className="panel detail-howto">
            <h2>{t("detail.howToPlay")}</h2>
            <ol>
              {game.howToPlay.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
            {game.howToWin?.length ? (
              <div className="detail-howto-sub">
                <h3>{t("detail.howToWin")}</h3>
                <ul>
                  {game.howToWin.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {game.rulesNotToBreak?.length ? (
              <div className="detail-howto-sub">
                <h3>{t("detail.rulesNotToBreak")}</h3>
                <ul>
                  {game.rulesNotToBreak.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>

          {game.tutorialVideo?.videoId ? (
            <div className="panel detail-tutorial">
              <h2>{t("detail.tutorial")}</h2>
              <p className="detail-tutorial-intro">{t("detail.tutorialIntro")}</p>
              <div className="detail-tutorial-frame">
                <iframe
                  title={game.tutorialVideo.title || t("detail.tutorial")}
                  src={`https://www.youtube-nocookie.com/embed/${game.tutorialVideo.videoId}`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="strict-origin-when-cross-origin"
                />
              </div>
              <div className="detail-tutorial-caption">
                <a
                  href={game.tutorialVideo.url}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  {game.tutorialVideo.title || t("detail.tutorialWatch")}
                </a>
                {game.tutorialVideo.channelTitle ? (
                  <span className="detail-tutorial-channel">
                    {game.tutorialVideo.channelTitle}
                  </span>
                ) : null}
                <span className="detail-tutorial-meta">
                  {game.tutorialVideo.likeCount != null
                    ? t("detail.tutorialMeta", {
                        views: formatCount(game.tutorialVideo.viewCount ?? 0),
                        likes: formatCount(game.tutorialVideo.likeCount),
                        age: game.tutorialVideo.publishedText || "—",
                      })
                    : t("detail.tutorialMetaNoLikes", {
                        views: formatCount(game.tutorialVideo.viewCount ?? 0),
                        age: game.tutorialVideo.publishedText || "—",
                      })}
                </span>
              </div>
            </div>
          ) : null}

          {game.variations.length > 0 ? (
            <details className="panel variations-panel" key={`variations-${game.slug}`}>
              <summary className="variations-summary">
                <span className="variations-summary-text">
                  <h2>{t("detail.variations")}</h2>
                  <span className="variations-summary-meta" data-closed="">
                    {t("detail.variationsToggle", { n: game.variations.length })}
                  </span>
                  <span className="variations-summary-meta" data-open="">
                    {t("detail.variationsToggleOpen", {
                      n: game.variations.length,
                    })}
                  </span>
                </span>
                <span className="variations-chevron" aria-hidden="true" />
              </summary>
              <p className="variations-intro">{t("detail.variationsIntro")}</p>
              <div className="variations">
                {game.variations.map((v) => {
                  const varPhotos = listDisplayImages(v.images).filter(isPhotographicSrc);
                  const varCover =
                    primaryCoverSrc(v.images) ??
                    primaryCoverSrc(game.images) ??
                    v.images?.[0];
                  const varThumbs = varPhotos.filter((src) => src !== varCover).slice(0, 3);
                  return (
                  <article className="variation" key={`${v.name}-${v.originCountry}`}>
                    {varCover ? (
                      <div className="variation-media">
                        <GameImage
                          src={varCover}
                          alt={v.name}
                          loading="lazy"
                          label={{
                            name: v.name,
                            category: game.category,
                            originCountry: v.originCountry,
                          }}
                        />
                        {varThumbs.length ? (
                          <div className="variation-thumbs">
                            {varThumbs.map((src) => (
                              <GameImage
                                key={src}
                                src={src}
                                alt=""
                                loading="lazy"
                                label={{
                                  ...imageLabel,
                                  name: v.name,
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
                  );
                })}
              </div>
            </details>
          ) : null}

          <GameAssistant game={game} />
        </div>

        <aside className="detail-aside">
          <div className="panel">
            <h2>{t("detail.images")}</h2>
            <GameImage
              className="main-shot"
              src={activeSrc}
              alt={`${game.name} reference`}
              label={imageLabel}
            />
            {galleryImages.length > 1 ? (
              <div className="gallery">
                {galleryImages.map((src, i) => (
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
                      label={imageLabel}
                    />
                  </button>
                ))}
              </div>
            ) : null}
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
