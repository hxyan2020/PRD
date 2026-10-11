import { useCatalog } from "../hooks/useCatalog";

export function AboutPage() {
  const { catalog } = useCatalog();

  return (
    <main className="shell section">
      <div className="section__head">
        <div>
          <h2>How Seen works</h2>
          <p>A living catalogue you unlock by noticing the world.</p>
        </div>
      </div>

      <div className="scan-panel">
        <div>
          <h3 style={{ fontFamily: "var(--font-display)", marginTop: 0 }}>Catalogue</h3>
          <p>
            Entries span cars & motorcycles, cigarettes (18+), alcohol, coffee &
            tea, soft drinks, food, snacks, dairy, clothes & sportswear, luxury &
            watches, beauty, tech, pharmacy, airlines, banks, instruments, toys,
            trees, flowers, animals, birds, and mushrooms. Covers start greyscale
            and locked until you confirm a sighting.
          </p>
          <h3 style={{ fontFamily: "var(--font-display)" }}>Scan flow</h3>
          <ol>
            <li>Pick one or more categories (or leave “all”).</li>
            <li>Take a picture or upload an image.</li>
            <li>
              AI OCR + visual cues propose up to 5 guesses with confidence % that
              add to 100%.
            </li>
            <li>
              If the image is unclear, you are asked to aim at the logo or upload a
              clearer shot.
            </li>
            <li>
              Confirm → match to catalogue → bingo unlock with colour restored.
            </li>
          </ol>
        </div>
        <div>
          <h3 style={{ fontFamily: "var(--font-display)", marginTop: 0 }}>Weekly refresh</h3>
          <p>
            Every Monday the catalogue runs a scheduled refresh that can add,
            modify, or rotate items. Locally: <code>npm run refresh</code>. In CI:
            GitHub Actions workflow <code>weekly-catalog-refresh.yml</code>.
          </p>
          {catalog && (
            <div className="banner">
              <p style={{ margin: 0 }}>
                <strong>Last refresh:</strong>{" "}
                {new Date(catalog.meta.lastRefreshAt).toLocaleString()}
              </p>
              <p style={{ margin: "0.4rem 0 0" }}>
                <strong>Next refresh:</strong>{" "}
                {new Date(catalog.meta.nextRefreshAt).toLocaleString()}
              </p>
              <p className="muted" style={{ margin: "0.6rem 0 0" }}>
                {catalog.meta.note}
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
