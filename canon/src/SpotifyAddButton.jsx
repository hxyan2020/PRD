import { useI18n } from "./I18n.jsx";

export default function SpotifyAddButton({ track, spotify }) {
  const { t } = useI18n();
  const saved = Boolean(spotify.saved[track.spotifyId]);
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
