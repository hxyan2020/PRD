import { Link } from "react-router-dom";
import { useCatalog } from "../hooks/useCatalog";
import { useUnlocks } from "../hooks/useUnlocks";
import { useI18n } from "../i18n/I18nProvider";
import { categoryIcon } from "../lib/categoryIcons";
import { categoryProgress } from "../lib/progress";
import { itemsForCategory } from "../lib/catalog";
import { formatPct } from "../lib/unlocks";

export function HomePage() {
  const { catalog, loading, error } = useCatalog();
  const { count, version } = useUnlocks();
  const { t } = useI18n();
  void version;

  return (
    <main>
      <section className="hero">
        <img
          className="hero__banner"
          src={`${import.meta.env.BASE_URL}banner-seen.png`}
          alt=""
          width={1000}
          height={609}
        />
        <div className="hero__veil" aria-hidden="true" />
        <div className="hero__content">
          <p className="hero__brand">
            <img
              className="hero__logo"
              src={`${import.meta.env.BASE_URL}logo-seen-white.png`}
              alt=""
              width={72}
              height={72}
            />
            {t("hero.brand")}
          </p>
          <h1>{t("hero.headline")}</h1>
          <p>{t("hero.blurb")}</p>
          <div className="cta-row">
            <Link className="btn btn--primary" to="/scan">
              {t("hero.ctaScan")}
            </Link>
            <Link className="btn btn--ghost" to="/catalog">
              {t("hero.ctaCatalog")}
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
              {catalog.categories.map((cat) => {
                const prog = categoryProgress(itemsForCategory(catalog, cat.id));
                return (
                  <Link key={cat.id} className="category-chip" to={`/catalog/${cat.id}`}>
                    <span className="category-chip__icon">{categoryIcon(cat.id)}</span>
                    <span className="category-chip__text">
                      <strong>{cat.label}</strong>
                      <span>
                        {prog.unlocked}/{prog.total} · {cat.kind}
                      </span>
                    </span>
                    <span className="category-chip__pct mono" title={`${cat.label} progress`}>
                      {formatPct(prog.pct)}
                    </span>
                  </Link>
                );
              })}
            </div>

            <div className="stats">
              <div className="stat">
                <b>{catalog.meta.itemCount}</b>
                <span>items in catalogue</span>
              </div>
              <div className="stat">
                <b>
                  {count}/{catalog.meta.itemCount}
                </b>
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
