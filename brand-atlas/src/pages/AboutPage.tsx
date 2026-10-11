import { useCatalog } from "../hooks/useCatalog";
import { useI18n } from "../i18n/I18nProvider";

export function AboutPage() {
  const { catalog } = useCatalog();
  const { t, lang } = useI18n();

  return (
    <main className="shell section">
      <div className="section__head">
        <div>
          <h2>{t("about.title")}</h2>
          <p>{t("about.blurb")}</p>
        </div>
      </div>

      <div className="scan-panel">
        <div>
          <h3 style={{ fontFamily: "var(--font-display)", marginTop: 0 }}>
            {t("about.catalogueTitle")}
          </h3>
          <p>{t("about.catalogueBody")}</p>
          <h3 style={{ fontFamily: "var(--font-display)" }}>{t("about.scanTitle")}</h3>
          <ol>
            <li>{t("about.scan1")}</li>
            <li>{t("about.scan2")}</li>
            <li>{t("about.scan3")}</li>
            <li>{t("about.scan4")}</li>
            <li>{t("about.scan5")}</li>
          </ol>
        </div>
        <div>
          <h3 style={{ fontFamily: "var(--font-display)", marginTop: 0 }}>
            {t("about.refreshTitle")}
          </h3>
          <p>{t("about.refreshBody")}</p>
          {catalog && (
            <div className="banner">
              <p style={{ margin: 0 }}>
                <strong>{t("about.lastRefresh")}</strong>{" "}
                {new Date(catalog.meta.lastRefreshAt).toLocaleString(lang)}
              </p>
              <p style={{ margin: "0.4rem 0 0" }}>
                <strong>{t("about.nextRefresh")}</strong>{" "}
                {new Date(catalog.meta.nextRefreshAt).toLocaleString(lang)}
              </p>
              <p className="muted" style={{ margin: "0.6rem 0 0" }}>
                {t("about.metaNote")}
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
