import { Link } from "react-router-dom";
import type { Game } from "../types/game";
import { excerpt } from "../lib/collection";
import { JournalActions } from "./JournalActions";
import { useI18n } from "../i18n";

export function GameCard({ game, index }: { game: Game; index: number }) {
  const { t } = useI18n();

  return (
    <article
      className="game-card"
      style={{ animationDelay: `${Math.min(index, 12) * 0.04}s` }}
    >
      <Link to={`/game/${game.slug}`} className="game-card-link">
        <div className="game-card-img">
          <img src={game.images[0]} alt="" loading="lazy" />
        </div>
        <div className="pill">{game.category}</div>
        <h3>{game.name}</h3>
        <div className="meta">
          {game.originCountry} · {game.creationYear}
          {game.variations.length > 0 ? (
            <>
              {" "}
              ·{" "}
              <span className="var-count">
                {t("collection.variations", { n: game.variations.length })}
              </span>
            </>
          ) : null}
        </div>
        <p className="excerpt">{excerpt(game.description)}</p>
      </Link>
      <JournalActions game={game} compact />
    </article>
  );
}
