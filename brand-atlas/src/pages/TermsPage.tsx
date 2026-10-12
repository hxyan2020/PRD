import { useI18n } from "../i18n/I18nProvider";

export function TermsPage() {
  const { t } = useI18n();

  return (
    <main className="shell section prose">
      <h2>{t("terms.title")}</h2>
      <p className="muted">{t("terms.updated")}</p>

      <h3>{t("terms.s1")}</h3>
      <p>{t("terms.s1body")}</p>

      <h3>{t("terms.s2")}</h3>
      <p>{t("terms.s2body")}</p>

      <h3>{t("terms.s3")}</h3>
      <p>{t("terms.s3body")}</p>

      <h3>{t("terms.s4")}</h3>
      <p>{t("terms.s4body")}</p>

      <h3>{t("terms.s5")}</h3>
      <p>{t("terms.s5body")}</p>

      <h3>{t("terms.s6")}</h3>
      <p>
        {t("terms.s6body").split("hello@seen-catalogue.example").map((part, i, arr) =>
          i < arr.length - 1 ? (
            <span key={i}>
              {part}
              <a href="mailto:hello@seen-catalogue.example">hello@seen-catalogue.example</a>
            </span>
          ) : (
            <span key={i}>{part}</span>
          ),
        )}
      </p>
    </main>
  );
}
