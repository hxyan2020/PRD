import { Link } from "react-router-dom";
import type { Game } from "../types/game";
import { excerpt } from "../lib/collection";

export function GameCard({ game, index }: { game: Game; index: number }) {
  return (
    <Link
      to={`/game/${game.slug}`}
      className="game-card"
      style={{ animationDelay: `${Math.min(index, 12) * 0.04}s` }}
    >
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
            · <span className="var-count">{game.variations.length} variations</span>
          </>
        ) : null}
      </div>
      <p className="excerpt">{excerpt(game.description)}</p>
    </Link>
  );
}
