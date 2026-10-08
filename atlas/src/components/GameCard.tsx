import { useState } from "react";
import { Link } from "react-router-dom";
import type { Game } from "../types/game";
import { excerpt } from "../lib/collection";
import {
  ludusBackdropDataUri,
  primaryCoverSrc,
} from "../lib/gameCardImage";
import { JournalActions } from "./JournalActions";
import { OriginCountry } from "./OriginCountry";
import { GameImage } from "./GameImage";
import { useI18n } from "../i18n";

export function GameCard({ game, index }: { game: Game; index: number }) {
  const { t } = useI18n();
  const cover = primaryCoverSrc(game.images);
  const backdrop = ludusBackdropDataUri(game.category, game.id || game.slug);
  const [coverFailed, setCoverFailed] = useState(false);
  const label = {
    name: game.name,
    category: game.category,
    originCountry: game.originCountry,
  };

  return (
    <article
      className="game-card"
      style={{ animationDelay: `${Math.min(index, 12) * 0.04}s` }}
    >
      <Link to={`/game/${game.slug}`} className="game-card-link">
        <div className="game-card-img" aria-hidden="true">
          {cover && !coverFailed ? (
            <GameImage
              src={cover}
              alt=""
              loading="lazy"
              label={label}
              onError={() => setCoverFailed(true)}
            />
          ) : (
            <img src={backdrop} alt="" loading="lazy" />
          )}
        </div>
        <div className="game-card-body">
          <div className="pill">{game.category}</div>
          <h3>{game.name}</h3>
          <div className="meta">
            <OriginCountry
              country={game.originCountry}
              countryKey={game.originCountryKey}
            />{" "}
            · {game.creationYear}
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
        </div>
      </Link>
      <JournalActions game={game} compact showPlayed={false} showEnter />
    </article>
  );
}
