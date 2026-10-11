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
        <svg
          className="hero__shapes"
          viewBox="0 0 1600 900"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
        >
          {/* Tall tower block — left */}
          <path
            className="hero__shape hero__shape--a"
            d="M412 70h118l8 38 4 520-6 92-14 48H428l-12-54-6-88 2-518z"
          />
          {/* Mid tower — right */}
          <path
            className="hero__shape hero__shape--b"
            d="M1188 120h86l6 28 2 210-4 36-10 22h-78l-8-24-4-38 2-208z"
          />
          {/* Wide foreground slab */}
          <path
            className="hero__shape hero__shape--c"
            d="M620 470l520-18 48 22 36 70-12 168-40 52-210 28-280 8-160-24-70-48 8-120 40-90z"
          />
          {/* Pixel spray / digital dust */}
          <g className="hero__shape-dust" fill="var(--lime)">
            <rect x="480" y="48" width="10" height="10" />
            <rect x="498" y="36" width="8" height="8" />
            <rect x="512" y="58" width="7" height="7" />
            <rect x="528" y="42" width="9" height="9" />
            <rect x="544" y="64" width="6" height="6" />
            <rect x="556" y="50" width="8" height="8" />
            <rect x="470" y="72" width="5" height="5" />
            <rect x="1240" y="96" width="9" height="9" />
            <rect x="1256" y="108" width="7" height="7" />
            <rect x="1270" y="88" width="8" height="8" />
            <rect x="1284" y="112" width="6" height="6" />
            <rect x="900" y="452" width="8" height="8" />
            <rect x="918" y="440" width="6" height="6" />
            <rect x="934" y="458" width="7" height="7" />
          </g>
        </svg>
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
