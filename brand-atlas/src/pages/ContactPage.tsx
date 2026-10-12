import { useI18n } from "../i18n/I18nProvider";

export function ContactPage() {
  const { t } = useI18n();

  return (
    <main className="shell section">
      <h2>{t("contact.title")}</h2>
      <p className="muted">{t("contact.blurb")}</p>
      <div className="banner">
        <p style={{ margin: 0 }}>
          <strong>{t("contact.emailLabel")}</strong>{" "}
          <a href="mailto:hello@seen-catalogue.example">hello@seen-catalogue.example</a>
        </p>
        <p style={{ margin: "0.6rem 0 0" }}>{t("contact.banner")}</p>
      </div>
      <form
        className="auth-form"
        onSubmit={(e) => {
          e.preventDefault();
          alert(t("contact.thanks"));
        }}
      >
        <div className="field">
          <label htmlFor="c-name">{t("contact.name")}</label>
          <input id="c-name" required />
        </div>
        <div className="field">
          <label htmlFor="c-email">{t("contact.email")}</label>
          <input id="c-email" type="email" required />
        </div>
        <div className="field">
          <label htmlFor="c-msg">{t("contact.message")}</label>
          <textarea id="c-msg" rows={5} required />
        </div>
        <button type="submit" className="btn btn--forest">
          {t("contact.send")}
        </button>
      </form>
    </main>
  );
}
