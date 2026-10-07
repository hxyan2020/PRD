import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { migrateGuestJournalIfNeeded } from "../lib/journal";
import { Footer } from "../components/Footer";
import { useI18n } from "../i18n";

export function RegisterPage() {
  const { register, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get("next") || "/journal";
  const { t } = useI18n();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (isLoggedIn) navigate(next, { replace: true });
  }, [isLoggedIn, navigate, next]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setBusy(true);
    const result = await register(email, password);
    setBusy(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    migrateGuestJournalIfNeeded(result.user.id);
    navigate(next, { replace: true });
  }

  return (
    <>
      <section className="section auth-section">
        <div className="container auth-shell">
          <div className="section-head">
            <h2>{t("auth.registerTitle")}</h2>
            <p>{t("auth.registerSub")}</p>
          </div>

          <form className="auth-form" onSubmit={onSubmit} noValidate>
            {error ? (
              <div className="auth-error" role="alert">
                {error}
              </div>
            ) : null}

            <div className="field">
              <label htmlFor="email">{t("auth.email")}</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="password">{t("auth.password")}</label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>

            <div className="field">
              <label htmlFor="confirm">{t("auth.confirm")}</label>
              <input
                id="confirm"
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                minLength={8}
              />
            </div>

            <button className="btn btn-primary" type="submit" disabled={busy}>
              {busy ? t("auth.creating") : t("auth.createBtn")}
            </button>
          </form>

          <p className="auth-switch">
            {t("auth.haveAccount")}{" "}
            <Link to={`/login?next=${encodeURIComponent(next)}`}>
              {t("auth.loginLink")}
            </Link>
          </p>
        </div>
      </section>
      <Footer />
    </>
  );
}
