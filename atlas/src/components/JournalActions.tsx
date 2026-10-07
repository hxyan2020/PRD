import type { Game } from "../types/game";
import { useJournal } from "../hooks/useJournal";

type Props = {
  game: Game;
  compact?: boolean;
};

export function JournalActions({ game, compact = false }: Props) {
  const { statusFor, toggle } = useJournal();
  const status = statusFor(game.id);

  return (
    <div
      className={`journal-actions${compact ? " journal-actions-compact" : ""}`}
    >
      <button
        type="button"
        className={`journal-btn${status.collected ? " is-active collect" : ""}`}
        aria-pressed={status.collected}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          toggle(game, "collected");
        }}
      >
        <span aria-hidden="true">{status.collected ? "★" : "☆"}</span>
        {status.collected ? "Collected" : "Collect"}
      </button>
      <button
        type="button"
        className={`journal-btn${status.played ? " is-active played" : ""}`}
        aria-pressed={status.played}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          toggle(game, "played");
        }}
      >
        <span aria-hidden="true">{status.played ? "●" : "○"}</span>
        {status.played ? "Played" : "Mark played"}
      </button>
    </div>
  );
}
