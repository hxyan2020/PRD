import { useI18n } from "./I18n.jsx";
import { spotifyOpenUrl } from "./spotify.js";

export default function SpotifyAddButton({ track, spotify }) {
  const { t } = useI18n();
  const saved = Boolean(spotify.saved[track.spotifyId]);
  const href = spotifyOpenUrl(track);

  if (!spotify.configured && href) {
    return (
      <a className="spotify-link" href={href} target="_blank" rel="noreferrer">
        {t("addToSpotify")}
      </a>
    );
  }

  return (
    <button
      type="button"
      className={saved ? "is-collected" : ""}
      disabled={spotify.busy || !track.spotifyId}
      onClick={() => spotify.addTrack(track)}
    >
      {saved ? t("onSpotify") : t("addToSpotify")}
    </button>
  );
}
