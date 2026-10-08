import { Link } from "react-router-dom";
import { useCatalog } from "../hooks/useCatalog";
import { useUnlocks } from "../hooks/useUnlocks";

export function HomePage() {
  const { catalog, loading, error } = useCatalog();
  const { count } = useUnlocks();

  return (
    <main>
      <section className="hero">
        <div className="hero__content">
          <p className="hero__brand">Seen</p>
          <h1>Photograph the world. Unlock the catalogue.</h1>
          <p>
            Cars, cigarettes, spirits, wine, sake, beer, coffee, tea, clothes,
            luxury, trees, flowers, animals, food — marks humans made and life
            still around. Spot one, confirm it, lift the greyscale.
          </p>
          <div className="cta-row">
            <Link className="btn btn--primary" to="/scan">
              Take a picture
            </Link>
            <Link className="btn btn--ghost" to="/catalog">
              Browse catalogue
            </Link>
          </div>
        </div>
      </section>

      <section className="shell section">
        <div className="section__head">
          <div>
            <h2>Pick a shelf</h2>
            <p>Choose categories before you scan, or wander the locked covers.</p>
          </div>
        </div>

        {loading && <p className="muted">Loading catalogue…</p>}
        {error && <p className="banner banner--warn">{error}</p>}

        {catalog && (
          <>
            <div className="category-grid">
              {catalog.categories.map((cat) => (
                <Link key={cat.id} className="category-chip" to={`/catalog/${cat.id}`}>
                  <strong>{cat.label}</strong>
                  <span>
                    {cat.itemCount} entries · {cat.kind}
                  </span>
                </Link>
              ))}
            </div>

            <div className="stats">
              <div className="stat">
                <b>{catalog.meta.itemCount}</b>
                <span>items in catalogue</span>
              </div>
              <div className="stat">
                <b>{count}</b>
                <span>unlocked by you</span>
              </div>
              <div className="stat">
                <b>weekly</b>
                <span>
                  next refresh{" "}
                  {new Date(catalog.meta.nextRefreshAt).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
