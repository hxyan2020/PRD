import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { loadCollection, type CollectionData } from "../lib/collection";
import { GameCard } from "../components/GameCard";
import { Footer } from "../components/Footer";

export function HomePage() {
  const [data, setData] = useState<CollectionData | null>(null);

  useEffect(() => {
    loadCollection().then(setData).catch(console.error);
  }, []);

  const featured = data?.games.filter((g) => g.variations.length > 0).slice(0, 6) ?? [];

  return (
    <>
      <section className="hero">
        <div className="hero-media" aria-hidden="true" />
        <div className="container hero-content">
          <p className="hero-brand">
            Ludus <span>Atlas</span>
          </p>
          <h1>Toys and games from every civilization.</h1>
          <p>
            One catalog of play across human history—board, ball, string, doll,
            and festival—where the same game wears many cultural faces as
            variations, not duplicates.
          </p>
          <div className="cta-row">
            <Link className="btn btn-primary" to="/collection">
              Browse the full collection
            </Link>
            <a className="btn btn-ghost" href="#featured">
              See featured lineages
            </a>
          </div>
        </div>
      </section>

      <section className="section" id="featured">
        <div className="container">
          <div className="section-head">
            <h2>Lineages with many faces</h2>
            <p>
              Mancala, chess, mills, shuttlecocks, and more—fundamentally one
              game, presented with cultural variations side by side.
            </p>
          </div>
          {data ? (
            <>
              <div className="meta-bar">
                <span>
                  Catalog size: <strong>{data.meta.totalGames.toLocaleString()}</strong>
                </span>
                <span>
                  Nested variations: <strong>{data.meta.totalVariations}</strong>
                </span>
                <span>
                  Categories: <strong>{data.meta.categories.length}</strong>
                </span>
              </div>
              <div className="game-grid">
                {featured.map((g, i) => (
                  <GameCard key={g.id} game={g} index={i} />
                ))}
              </div>
              <div className="cta-row" style={{ marginTop: "2rem" }}>
                <Link className="btn btn-primary" to="/collection">
                  Open all {data.meta.totalGames.toLocaleString()} entries
                </Link>
              </div>
            </>
          ) : (
            <div className="loading">Loading catalog…</div>
          )}
        </div>
      </section>
      <Footer total={data?.meta.totalGames} />
    </>
  );
}
