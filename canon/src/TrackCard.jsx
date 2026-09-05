import CollectButton from "./CollectButton.jsx";
import { formatStreams, primaryArtist } from "./format.js";

export default function TrackCard({
  track,
  selected,
  collectedIds,
  onToggleCollect,
  onOpen,
}) {
  const collected = collectedIds.includes(track.id);
  return (
    <article className={`card ${selected ? "is-open" : ""} ${collected ? "is-saved" : ""}`}>
      <button className="cover-btn" onClick={() => onOpen(track, true)} type="button">
        <img src={track.coverUrl} alt={`Official album cover for ${track.name}`} loading="lazy" />
        {track.rank ? <span className="rank">#{String(track.rank).padStart(3, "0")}</span> : null}
        {collected ? <span className="collected-mark">Collected</span> : null}
      </button>
      <div className="card-body">
        <h2>{track.name}</h2>
        <p className="artist">{primaryArtist(track)}</p>
        <p className="meta-line">
          {track.year || "Year unknown"} · {track.genre}
        </p>
        <p className="plays">{formatStreams(track.streams)} plays</p>
        <div className="card-actions">
          <button type="button" onClick={() => onOpen(track, true)}>
            Listen
          </button>
          <CollectButton id={track.id} collectedIds={collectedIds} onToggle={onToggleCollect} />
          <a href={track.spotifyUrl} target="_blank" rel="noreferrer">
            Spotify
          </a>
        </div>
      </div>
    </article>
  );
}
