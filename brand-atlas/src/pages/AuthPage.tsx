import { useState, type FormEvent } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { logIn, signUp } from "../lib/auth";
import { useAuth } from "../hooks/useAuth";
import { useI18n } from "../i18n/I18nProvider";

type AuthMode = "login" | "signup";

/** Only allow in-app relative return paths (block open redirects). */
function resolveReturnTo(params: URLSearchParams): string {
  const raw = params.get("next") || "/catalog";
  const path = raw.startsWith("/") && !raw.startsWith("//") ? raw : "/catalog";
  const item = params.get("item");
  if (!item) return path;
  const qIndex = path.indexOf("?");
  const hIndex = path.indexOf("#");
  const pathname = path.slice(
    0,
    qIndex >= 0 ? qIndex : hIndex >= 0 ? hIndex : path.length,
  );
  const search =
    qIndex >= 0
      ? path.slice(qIndex + 1, hIndex >= 0 ? hIndex : undefined)
      : "";
  const hash = hIndex >= 0 ? path.slice(hIndex) : "";
  const qs = new URLSearchParams(search);
  qs.set("item", item);
  const q = qs.toString();
  return `${pathname}${q ? `?${q}` : ""}${hash}`;
}

export function AuthPage({ mode: initialMode = "login" }: { mode?: AuthMode }) {
  const { t } = useI18n();
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const paramMode = params.get("mode");
  const startMode: AuthMode =
    initialMode === "signup" || paramMode === "signup" ? "signup" : "login";
  const returnTo = resolveReturnTo(params);

  const [mode, setMode] = useState<AuthMode>(startMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (isLoggedIn) {
    return <Navigate to={returnTo} replace />;
  }

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
    navigate(returnTo);
  };

  const switchMode = (next: AuthMode) => {
    setMode(next);
    setError(null);
  };

  return (
    <main className="shell section auth-page">
      <h2>{mode === "login" ? t("auth.loginTitle") : t("auth.signupTitle")}</h2>
      <p className="muted">{t("auth.persistHint")}</p>

      <div className="auth-tabs" role="tablist" aria-label={t("auth.accountTabs")}>
        <button
          type="button"
          role="tab"
          className={`auth-tabs__tab ${mode === "login" ? "is-on" : ""}`}
          aria-selected={mode === "login"}
          onClick={() => switchMode("login")}
        >
          {t("nav.login")}
        </button>
        <button
          type="button"
          role="tab"
          className={`auth-tabs__tab ${mode === "signup" ? "is-on" : ""}`}
          aria-selected={mode === "signup"}
          onClick={() => switchMode("signup")}
        >
          {t("nav.signup")}
        </button>
      </div>

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
    </main>
  );
}
