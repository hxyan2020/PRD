export default function SpotifyAddButton({ track, spotify }) {
  const saved = Boolean(spotify.saved[track.spotifyId]);
  return (
    <button
      type="button"
      className={saved ? "is-collected" : ""}
      disabled={spotify.busy || !track.spotifyId}
      onClick={() => spotify.addTrack(track)}
    >
      {saved ? "On Spotify" : "Add to Spotify"}
    </button>
  );
}
