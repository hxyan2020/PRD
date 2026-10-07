import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { loadCollection } from "../lib/collection";
import type { Game } from "../types/game";
import { Footer } from "../components/Footer";

export function GameDetailPage() {
  const { slug } = useParams();
  const [game, setGame] = useState<Game | null | undefined>(undefined);
  const [activeImg, setActiveImg] = useState(0);
  const [total, setTotal] = useState<number>();

  useEffect(() => {
    let alive = true;
    loadCollection().then((data) => {
      if (!alive) return;
      setTotal(data.meta.totalGames);
      const found = data.games.find((g) => g.slug === slug) ?? null;
      setGame(found);
      setActiveImg(0);
    });
    return () => {
      alive = false;
    };
  }, [slug]);

  if (game === undefined) {
    return <div className="loading">Loading entry…</div>;
  }

  if (!game) {
    return (
      <div className="error">
        <div>
          <p>Game not found.</p>
          <Link className="btn btn-primary" to="/collection">
            Back to collection
          </Link>
        </div>
      </div>
    );
  }

  const shot = game.images[activeImg] ?? game.images[0];

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
              <strong style={{ color: "var(--mist)" }}>Origin:</strong>{" "}
              {game.originCountry}
            </span>
            <span>
              <strong style={{ color: "var(--mist)" }}>Civilization:</strong>{" "}
              {game.civilization}
            </span>
            <span>
              <strong style={{ color: "var(--mist)" }}>Created:</strong>{" "}
              {game.creationYear}
            </span>
            <span>
              <strong style={{ color: "var(--mist)" }}>Players:</strong>{" "}
              {game.idealParticipants}
            </span>
          </div>
        </div>
      </section>

      <div className="container detail-layout">
        <div>
          <div className="panel">
            <h2>About this game / toy</h2>
            <p style={{ color: "var(--mist-dim)" }}>{game.description}</p>
          </div>

          <div className="panel">
            <h2>How to play</h2>
            <ol>
              {game.howToPlay.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </div>

          {game.variations.length > 0 ? (
            <div className="panel">
              <h2>Cultural variations</h2>
              <p style={{ color: "var(--mist-dim)" }}>
                These are fundamentally the same game or toy, expressed in
                different places and eras—not separate catalog inventions.
              </p>
              <div className="variations">
                {game.variations.map((v) => (
                  <article className="variation" key={`${v.name}-${v.originCountry}`}>
                    <h3>{v.name}</h3>
                    <div className="meta">
                      {v.originCountry} · {v.creationYear}
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
            <h2>Images</h2>
            <img className="main-shot" src={shot} alt={`${game.name} reference`} />
            <div className="gallery">
              {game.images.map((src, i) => (
                <button
                  type="button"
                  key={`${src}-${i}`}
                  className={i === activeImg ? "active" : undefined}
                  onClick={() => setActiveImg(i)}
                  aria-label={`Show image ${i + 1}`}
                >
                  <img src={src} alt="" loading="lazy" />
                </button>
              ))}
            </div>
          </div>

          <div className="panel">
            <h2>Requirements</h2>
            <ul>
              {game.requirements.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </div>

          <div className="panel">
            <h2>Ideal participants</h2>
            <p style={{ color: "var(--mist-dim)", margin: 0 }}>
              {game.idealParticipants}
            </p>
          </div>

          <div className="panel">
            <h2>Where to buy</h2>
            <p style={{ color: "var(--mist-dim)", fontSize: "0.92rem" }}>
              Product pages from different platforms so you can compare by
              region and shipping.
            </p>
            <ul className="buy-list">
              {game.purchaseLinks.map((link) => (
                <li key={link.url}>
                  <a href={link.url} target="_blank" rel="noreferrer noopener">
                    <span className="platform">{link.platform}</span>
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <Link className="btn btn-ghost" to="/collection">
            ← Back to collection
          </Link>
        </aside>
      </div>
      <Footer total={total} />
    </>
  );
}
