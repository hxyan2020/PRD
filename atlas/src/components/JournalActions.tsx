import { Link, useNavigate, useLocation } from "react-router-dom";
import type { Game } from "../types/game";
import { useJournal } from "../hooks/useJournal";
import { useAuth } from "../hooks/useAuth";
import { useI18n } from "../i18n";

type Props = {
  game: Game;
  compact?: boolean;
  /** When false, hide Mark played (card surfaces). Default true. */
  showPlayed?: boolean;
  /** When true, show a theme-highlighted Enter link to the detail page. */
  showEnter?: boolean;
};

export function JournalActions({
  game,
  compact = false,
  showPlayed = true,
  showEnter = false,
}: Props) {
  const { statusFor, toggle } = useJournal();
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const status = statusFor(game.id);
  const { t } = useI18n();

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
        title={isLoggedIn ? undefined : t("nav.login")}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          requireAuth(() => toggle(game, "collected"));
        }}
      >
        <span aria-hidden="true">{status.collected ? "★" : "☆"}</span>
        {status.collected ? t("actions.collected") : t("actions.collect")}
      </button>
      {showPlayed ? (
        <button
          type="button"
          className={`journal-btn${status.played ? " is-active played" : ""}`}
          aria-pressed={status.played}
          title={isLoggedIn ? undefined : t("nav.login")}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            requireAuth(() => toggle(game, "played"));
          }}
        >
          <span aria-hidden="true">{status.played ? "●" : "○"}</span>
          {status.played ? t("actions.played") : t("actions.markPlayed")}
        </button>
      ) : null}
      {showEnter ? (
        <Link
          to={`/game/${game.slug}`}
          className="journal-btn journal-btn-enter"
          onClick={(e) => e.stopPropagation()}
        >
          {t("actions.enter")}
        </Link>
      ) : null}
    </div>
  );
}
