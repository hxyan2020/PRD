import { Link } from "react-router-dom";
import { useCatalog } from "../hooks/useCatalog";
import { useUnlocks } from "../hooks/useUnlocks";
import { useI18n } from "../i18n/I18nProvider";
import { categoryLabel } from "../i18n/labels";
import { categoryIcon } from "../lib/categoryIcons";
import { categoryProgress } from "../lib/progress";
import { itemsForCategory } from "../lib/catalog";
import { formatPct } from "../lib/unlocks";

export function HomePage() {
  const { catalog, loading, error } = useCatalog();
  const { count, version } = useUnlocks();
  const { t, lang } = useI18n();
  void version;

  return (
    <main>
      <section className="hero">
        <img
          className="hero__banner"
          src={`${import.meta.env.BASE_URL}banner-seen.jpg`}
          alt=""
          width={3200}
          height={1948}
          decoding="async"
          fetchPriority="high"
        />
        <div className="hero__shapes" aria-hidden="true">
          <span className="hero__shape-circle" />
        </div>
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
            <h2>{t("home.pickShelf")}</h2>
            <p>{t("home.pickShelfBlurb")}</p>
          </div>
        </div>

        {loading && <p className="muted">{t("home.loading")}</p>}
        {error && <p className="banner banner--warn">{error}</p>}

        {catalog && (
          <>
            <div className="category-grid">
              {catalog.categories.map((cat) => {
                const prog = categoryProgress(itemsForCategory(catalog, cat.id));
                const label = categoryLabel(t, cat.id, cat.label);
                return (
                  <Link key={cat.id} className="category-chip" to={`/catalog/${cat.id}`}>
                    <span className="category-chip__icon">{categoryIcon(cat.id)}</span>
                    <span className="category-chip__text">
                      <strong>{label}</strong>
                      <span>
                        {prog.unlocked}/{prog.total} ·{" "}
                        {cat.kind === "nature" ? t("home.kindNature") : t("home.kindBrand")}
                      </span>
                    </span>
                    <span className="category-chip__pct mono" title={`${label} ${t("catalog.progress")}`}>
                      {formatPct(prog.pct)}
                    </span>
                  </Link>
                );
              })}
            </div>

            <div className="stats">
              <div className="stat">
                <b>{catalog.meta.itemCount}</b>
                <span>{t("home.itemsInCatalogue")}</span>
              </div>
              <div className="stat">
                <b>
                  {count}/{catalog.meta.itemCount}
                </b>
                <span>{t("home.unlockedByYou")}</span>
              </div>
              <div className="stat">
                <b>{t("home.weekly")}</b>
                <span>
                  {t("home.nextRefresh", {
                    date: new Date(catalog.meta.nextRefreshAt).toLocaleDateString(lang, {
                      month: "short",
                      day: "numeric",
                    }),
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
