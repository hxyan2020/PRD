import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { migrateGuestJournalIfNeeded } from "../lib/journal";
import { Footer } from "../components/Footer";

export function LoginPage() {
  const { login, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get("next") || "/journal";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (isLoggedIn) navigate(next, { replace: true });
  }, [isLoggedIn, navigate, next]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const result = await login(email, password);
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
            <h2>Log in</h2>
            <p>
              Sign in with your email and password. You stay logged in on this
              device until you log out.
            </p>
          </div>

          <form className="auth-form" onSubmit={onSubmit} noValidate>
            {error ? (
              <div className="auth-error" role="alert">
                {error}
              </div>
            ) : null}

            <div className="field">
              <label htmlFor="email">Email</label>
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
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button className="btn btn-primary" type="submit" disabled={busy}>
              {busy ? "Signing in…" : "Log in"}
            </button>
          </form>

          <p className="auth-switch">
            New here?{" "}
            <Link to={`/register?next=${encodeURIComponent(next)}`}>
              Create an account
            </Link>
          </p>
        </div>
      </section>
      <Footer />
    </>
  );
}
