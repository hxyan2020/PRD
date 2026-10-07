import { useNavigate, useLocation } from "react-router-dom";
import type { Game } from "../types/game";
import { useJournal } from "../hooks/useJournal";
import { useAuth } from "../hooks/useAuth";

type Props = {
  game: Game;
  compact?: boolean;
};

export function JournalActions({ game, compact = false }: Props) {
  const { statusFor, toggle } = useJournal();
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const status = statusFor(game.id);

  function requireAuth(action: () => void) {
    if (!isLoggedIn) {
      const next = `${location.pathname}${location.search}` || `/game/${game.slug}`;
      navigate(`/login?next=${encodeURIComponent(next)}`);
      return;
    }
    action();
  }

  return (
    <div
      className={`journal-actions${compact ? " journal-actions-compact" : ""}`}
    >
      <button
        type="button"
        className={`journal-btn${status.collected ? " is-active collect" : ""}`}
        aria-pressed={status.collected}
        title={isLoggedIn ? undefined : "Log in to collect"}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          requireAuth(() => toggle(game, "collected"));
        }}
      >
        <span aria-hidden="true">{status.collected ? "★" : "☆"}</span>
        {status.collected ? "Collected" : "Collect"}
      </button>
      <button
        type="button"
        className={`journal-btn${status.played ? " is-active played" : ""}`}
        aria-pressed={status.played}
        title={isLoggedIn ? undefined : "Log in to mark played"}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          requireAuth(() => toggle(game, "played"));
        }}
      >
        <span aria-hidden="true">{status.played ? "●" : "○"}</span>
        {status.played ? "Played" : "Mark played"}
      </button>
    </div>
  );
}
