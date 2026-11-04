import { useEffect, useState } from "react";
import {
  changePassword,
  createAccount,
  credentialsFromForm,
  getCurrentUser,
  login,
  logout,
  resetPassword,
  syncSessionToRemote,
  updateProfileName,
} from "./auth.js";
import { useI18n } from "./I18n.jsx";

const ERROR_KEYS = {
  invalid_email: "authErrorInvalidEmail",
  short_password: "authErrorShortPassword",
  email_taken: "authErrorEmailTaken",
  no_account: "authErrorNoAccount",
  bad_password: "authErrorBadPassword",
  not_signed_in: "authErrorNotSignedIn",
  unavailable: "authErrorUnavailable",
};

function emptyForm() {
  return {
    name: "",
    email: "",
    password: "",
    confirm: "",
    currentPassword: "",
    newPassword: "",
  };
}

export default function Profile() {
  const { t } = useI18n();
  const [user, setUser] = useState(() => getCurrentUser());
  const [mode, setMode] = useState("signin");
  const [form, setForm] = useState(() => {
    const current = getCurrentUser();
    return { ...emptyForm(), name: current?.name || "", email: current?.email || "" };
  });
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!getCurrentUser()) return undefined;
    let cancelled = false;
    void syncSessionToRemote().then((result) => {
      if (!cancelled && result?.user) setUser(result.user);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  function field(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function flash(key) {
    setError("");
    setStatus(key);
  }

  function fail(code) {
    setStatus("");
    setError(ERROR_KEYS[code] || "authErrorBadPassword");
  }

  async function apply(result, successKey) {
    if (!result.ok) {
      fail(result.error);
      return;
    }
    setUser(result.user);
    setForm((prev) => ({
      ...emptyForm(),
      email: result.user?.email || prev.email,
      name: result.user?.name || "",
    }));
    if (successKey) flash(successKey);
    else {
      setError("");
      setStatus("");
    }
  }

  async function submit(event, run) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await run(credentialsFromForm(event.currentTarget, form));
    } catch {
      fail("unavailable");
    } finally {
      setBusy(false);
    }
  }

  async function onCreate(event) {
    await submit(event, async (fields) => {
      if (fields.password !== fields.confirm) {
        setStatus("");
        setError("authErrorMismatch");
        return;
      }
      await apply(await createAccount({ email: fields.email, password: fields.password, name: fields.name }), "profileCreated");
    });
  }

  async function onSignIn(event) {
    await submit(event, async (fields) => {
      await apply(await login({ email: fields.email, password: fields.password }), "");
    });
  }

  async function onReset(event) {
    await submit(event, async (fields) => {
      if (fields.newPassword !== fields.confirm) {
        setStatus("");
        setError("authErrorMismatch");
        return;
      }
      await apply(await resetPassword({ email: fields.email, newPassword: fields.newPassword }), "profilePasswordReset");
    });
  }

  async function onChangePassword(event) {
    await submit(event, async (fields) => {
      if (fields.newPassword !== fields.confirm) {
        setStatus("");
        setError("authErrorMismatch");
        return;
      }
      await apply(
        await changePassword({ currentPassword: fields.currentPassword, newPassword: fields.newPassword }),
        "profilePasswordChanged",
      );
    });
  }

  async function onSaveName(event) {
    await submit(event, async (fields) => {
      const result = await updateProfileName(fields.name);
      if (!result.ok) {
        fail(result.error);
        return;
      }
      setUser(result.user);
      setForm((prev) => ({ ...prev, name: result.user?.name || fields.name }));
      flash("profileNameSaved");
    });
  }

  function onSignOut() {
    logout();
    setUser(null);
    setForm(emptyForm());
    setMode("signin");
    flash("profileSignedOut");
  }

  const displayName = user?.name || user?.email || "";
  const working = busy ? t("profileWorking") : "";

  return (
    <section className="daily daily-prefs profile" aria-label={t("profileTitle")}>
      <div className="daily-copy">
        <p className="eyebrow">{t("profileEyebrow")}</p>
        <h2>{t("profileTitle")}</h2>
        <p>{user ? t("profileSignedInAs", { name: displayName }) : t("profileIntro")}</p>
        <p className="profile-note">{t("profileLocalNote")}</p>
        {error ? (
          <p className="profile-banner is-error" role="alert">
            {t(error)}
          </p>
        ) : null}
        {status ? (
          <p className="profile-banner is-ok" role="status">
            {t(status)}
          </p>
        ) : null}

        {user ? (
          <>
            <form className="daily-form profile-form" onSubmit={onSaveName} aria-busy={busy}>
              <label>
                {t("profileName")}
                <input
                  type="text"
                  name="name"
                  autoComplete="nickname"
                  value={form.name}
                  onChange={(event) => field("name", event.target.value)}
                />
              </label>
              <label>
                {t("profileEmail")}
                <input type="email" value={user.email} readOnly />
              </label>
              <div className="daily-actions">
                <button type="submit" disabled={busy}>
                  {busy ? working : t("profileSaveName")}
                </button>
                <button type="button" className="ghost" onClick={onSignOut} disabled={busy}>
                  {t("profileSignOut")}
                </button>
              </div>
            </form>

            <form className="daily-form profile-form" onSubmit={onChangePassword} aria-busy={busy}>
              <label>
                {t("profileCurrentPassword")}
                <input
                  type="password"
                  name="current-password"
                  autoComplete="current-password"
                  value={form.currentPassword}
                  onChange={(event) => field("currentPassword", event.target.value)}
                  required
                />
              </label>
              <label>
                {t("profileNewPassword")}
                <input
                  type="password"
                  name="new-password"
                  autoComplete="new-password"
                  value={form.newPassword}
                  onChange={(event) => field("newPassword", event.target.value)}
                  minLength={8}
                  required
                />
              </label>
              <label>
                {t("profilePasswordConfirm")}
                <input
                  type="password"
                  name="confirm-password"
                  autoComplete="new-password"
                  value={form.confirm}
                  onChange={(event) => field("confirm", event.target.value)}
                  minLength={8}
                  required
                />
              </label>
              <p className="profile-hint">{t("profilePasswordHint")}</p>
              <div className="daily-actions">
                <button type="submit" disabled={busy}>
                  {busy ? working : t("profileChangePassword")}
                </button>
              </div>
            </form>
          </>
        ) : (
          <>
            <div className="profile-modes" role="tablist" aria-label={t("profileTitle")}>
              <button type="button" className={mode === "signin" ? "is-on" : ""} onClick={() => setMode("signin")} disabled={busy}>
                {t("profileSignIn")}
              </button>
              <button type="button" className={mode === "create" ? "is-on" : ""} onClick={() => setMode("create")} disabled={busy}>
                {t("profileNeedAccount")}
              </button>
              <button type="button" className={mode === "reset" ? "is-on" : ""} onClick={() => setMode("reset")} disabled={busy}>
                {t("profileForgot")}
              </button>
            </div>

            {mode === "create" ? (
              <form className="daily-form profile-form" onSubmit={onCreate} aria-busy={busy}>
                <label>
                  {t("profileName")}
                  <input
                    type="text"
                    name="name"
                    autoComplete="nickname"
                    value={form.name}
                    onChange={(event) => field("name", event.target.value)}
                  />
                </label>
                <label>
                  {t("profileEmail")}
                  <input
                    type="email"
                    name="email"
                    autoComplete="email"
                    value={form.email}
                    onChange={(event) => field("email", event.target.value)}
                    required
                  />
                </label>
                <label>
                  {t("profilePassword")}
                  <input
                    type="password"
                    name="new-password"
                    autoComplete="new-password"
                    value={form.password}
                    onChange={(event) => field("password", event.target.value)}
                    minLength={8}
                    required
                  />
                </label>
                <label>
                  {t("profilePasswordConfirm")}
                  <input
                    type="password"
                    name="confirm-password"
                    autoComplete="new-password"
                    value={form.confirm}
                    onChange={(event) => field("confirm", event.target.value)}
                    minLength={8}
                    required
                  />
                </label>
                <p className="profile-hint">{t("profilePasswordHint")}</p>
                <div className="daily-actions">
                  <button type="submit" disabled={busy}>
                    {busy ? working : t("profileCreate")}
                  </button>
                </div>
              </form>
            ) : null}

            {mode === "signin" ? (
              <form className="daily-form profile-form" onSubmit={onSignIn} aria-busy={busy}>
                <label>
                  {t("profileEmail")}
                  <input
                    type="email"
                    name="email"
                    autoComplete="email"
                    value={form.email}
                    onChange={(event) => field("email", event.target.value)}
                    required
                  />
                </label>
                <label>
                  {t("profilePassword")}
                  <input
                    type="password"
                    name="password"
                    autoComplete="current-password"
                    value={form.password}
                    onChange={(event) => field("password", event.target.value)}
                    minLength={8}
                    required
                  />
                </label>
                <div className="daily-actions">
                  <button type="submit" disabled={busy}>
                    {busy ? working : t("profileSignIn")}
                  </button>
                </div>
              </form>
            ) : null}

            {mode === "reset" ? (
              <form className="daily-form profile-form" onSubmit={onReset} aria-busy={busy}>
                <label>
                  {t("profileEmail")}
                  <input
                    type="email"
                    name="email"
                    autoComplete="email"
                    value={form.email}
                    onChange={(event) => field("email", event.target.value)}
                    required
                  />
                </label>
                <label>
                  {t("profileNewPassword")}
                  <input
                    type="password"
                    name="new-password"
                    autoComplete="new-password"
                    value={form.newPassword}
                    onChange={(event) => field("newPassword", event.target.value)}
                    minLength={8}
                    required
                  />
                </label>
                <label>
                  {t("profilePasswordConfirm")}
                  <input
                    type="password"
                    name="confirm-password"
                    autoComplete="new-password"
                    value={form.confirm}
                    onChange={(event) => field("confirm", event.target.value)}
                    minLength={8}
                    required
                  />
                </label>
                <p className="profile-hint">{t("profilePasswordHint")}</p>
                <div className="daily-actions">
                  <button type="submit" disabled={busy}>
                    {busy ? working : t("profileReset")}
                  </button>
                </div>
              </form>
            ) : null}
          </>
        )}
      </div>
    </section>
  );
}
