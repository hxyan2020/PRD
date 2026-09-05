import { ABOUT_SECTIONS, TERMS_SECTIONS } from "./pages.js";
import { useI18n } from "./I18n.jsx";

export function SiteNav({ page }) {
  const { t } = useI18n();
  return (
    <nav className="site-nav" aria-label={t("siteNav")}>
      <a href="#about" className={page === "about" ? "is-on" : ""}>
        {t("aboutNav")}
      </a>
      <a href="#terms" className={page === "terms" ? "is-on" : ""}>
        {t("termsNav")}
      </a>
      <a href="#hx-monitor" className={page === "hx-monitor" || page === "hx-ping" ? "is-on" : ""}>
        {t("hx.nav.monitor")}
      </a>
      <a href="#hx-viewership" className={page === "hx-viewership" ? "is-on" : ""}>
        {t("hx.nav.views")}
      </a>
      {page !== "home" ? (
        <a href="#" className="site-nav-back">
          {t("backToArchive")}
        </a>
      ) : null}
    </nav>
  );
}

export function SiteDoc({ page }) {
  const { t } = useI18n();
  const isAbout = page === "about";
  const sections = isAbout ? ABOUT_SECTIONS : TERMS_SECTIONS;
  return (
    <article className="site-doc" aria-label={isAbout ? t("aboutTitle") : t("termsTitle")}>
      <p className="eyebrow">{isAbout ? t("aboutEyebrow") : t("termsEyebrow")}</p>
      <h2>{isAbout ? t("aboutTitle") : t("termsTitle")}</h2>
      <p className="site-doc-lead">{isAbout ? t("aboutLead") : t("termsUpdated")}</p>
      {sections.map(([titleKey, bodyKey]) => (
        <section key={titleKey}>
          <h3>{t(titleKey)}</h3>
          <p>{t(bodyKey)}</p>
        </section>
      ))}
      <SiteNav page={page} />
    </article>
  );
}
