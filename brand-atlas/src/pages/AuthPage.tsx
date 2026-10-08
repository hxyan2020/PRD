import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { logIn, signUp } from "../lib/auth";
import { useI18n } from "../i18n/I18nProvider";

export function AuthPage({ mode }: { mode: "login" | "signup" }) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = mode === "login" ? await logIn(email, password) : await signUp(email, password);
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    navigate("/catalog");
  };

  return (
    <main className="shell section auth-page">
      <h2>{mode === "login" ? t("auth.loginTitle") : t("auth.signupTitle")}</h2>
      <p className="muted">
        Session stays signed in on this device until you log out.
      </p>
      <form className="auth-form" onSubmit={(e) => void submit(e)}>
        <div className="field">
          <label htmlFor="email">{t("auth.email")}</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="password">{t("auth.password")}</label>
          <input
            id="password"
            type="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error && <p className="banner banner--warn">{error}</p>}
        <button type="submit" className="btn btn--forest" disabled={busy}>
          {mode === "login" ? t("auth.loginTitle") : t("auth.signupTitle")}
        </button>
      </form>
      <p className="muted" style={{ marginTop: "1rem" }}>
        {mode === "login" ? (
          <>
            New here? <Link to="/signup">{t("nav.signup")}</Link>
          </>
        ) : (
          <>
            Already have an account? <Link to="/login">{t("nav.login")}</Link>
          </>
        )}
      </p>
    </main>
  );
}
