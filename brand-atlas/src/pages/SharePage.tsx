import { Link, useParams } from "react-router-dom";
import { useCatalog } from "../hooks/useCatalog";
import { coverGradient, findItem, getCategory } from "../lib/catalog";
import { formatUtc, getUnlockByShareId } from "../lib/unlocks";

export function SharePage() {
  const { shareId } = useParams();
  const { catalog, loading } = useCatalog();
  const unlock = shareId ? getUnlockByShareId(shareId) : undefined;
  const item = catalog && unlock ? findItem(catalog, unlock.itemId) : undefined;
  const cat = catalog && item ? getCategory(catalog, item.categoryId) : undefined;

  if (loading) return <main className="shell section">Loading…</main>;

  if (!unlock || !item) {
    return (
      <main className="shell section">
        <h2>Link not found</h2>
        <p className="muted">
          This permanent link is not on this device, or the unlock was cleared.
        </p>
        <Link className="btn btn--forest" to="/">
          Go home
        </Link>
      </main>
    );
  }

  return (
    <main className="shell section">
      <div className="share-card">
        <div
          className="detail-cover"
          style={{ background: coverGradient(item.coverHue, true) }}
        />
        <p className="muted">{cat?.label}</p>
        <h2>{item.name}</h2>
        <p>{item.summary}</p>
        <dl className="fact-list">
          {Object.entries(item.facts ?? {}).map(([k, v]) => (
            <div key={k}>
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
        <p>
          <strong>Seen at (UTC):</strong>{" "}
          <span className="mono">{formatUtc(unlock.unlockedAt)}</span>
        </p>
        {unlock.note && (
          <p>
            <strong>Field note:</strong> {unlock.note}
          </p>
        )}
        {unlock.photoDataUrl && (
          <img className="sighting-photo" src={unlock.photoDataUrl} alt="Sighting" />
        )}
        <p className="muted mono" style={{ fontSize: "0.8rem" }}>
          Permanent link id: {unlock.shareId}
        </p>
        <Link className="btn btn--forest" to={`/catalog/${item.categoryId}`}>
          Open in catalogue
        </Link>
      </div>
    </main>
  );
}
