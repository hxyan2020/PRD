"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { authLogin, authLogout, authMe, authRegister } from "@/lib/client-api";
import { useI18n } from "@/lib/i18n/context";

type User = { id: string; email: string };

export function AuthAccount() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useI18n();
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [mode, setMode] = useState<"register" | "login">("register");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const requested = searchParams.get("mode");
    if (requested === "login" || requested === "register") {
      setMode(requested);
    }
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const me = await authMe();
      if (!cancelled) setUser(me);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const result =
        mode === "login"
          ? await authLogin(email, password)
          : await authRegister(email, password);
      if (result.error || !result.user) throw new Error(result.error || "Request failed");
      setUser(result.user);
      window.dispatchEvent(new Event("venturescan:auth"));
      router.replace("/account");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    setBusy(true);
    await authLogout();
    setUser(null);
    setMode("register");
    setBusy(false);
    window.dispatchEvent(new Event("venturescan:auth"));
    router.replace("/account");
    router.refresh();
  }

  if (user === undefined) {
    return (
      <div className="mx-auto w-full max-w-md px-4 py-16 text-sm text-mist sm:px-6">
        {t("auth.wait")}
      </div>
    );
  }

  if (user) {
    return (
      <div className="mx-auto w-full max-w-md px-4 py-16 sm:px-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-celadon">
          {t("auth.signedInKicker")}
        </p>
        <h1 className="mt-3 font-display text-4xl text-foam">{t("auth.signedInTitle")}</h1>
        <p className="mt-3 text-sm text-mist">{t("auth.signedInBody")}</p>
        <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-mist">
            {t("auth.email")}
          </p>
          <p className="mt-1 break-all text-foam">{user.email}</p>
        </div>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link href="/collection" className="btn-primary text-center sm:flex-1">
            {t("nav.collection")}
          </Link>
          <button
            type="button"
            className="btn-ghost sm:flex-1"
            disabled={busy}
            onClick={() => void logout()}
          >
            {busy ? t("auth.wait") : t("nav.logout")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md px-4 py-16 sm:px-6">
      <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-celadon">
        {mode === "login" ? t("auth.loginKicker") : t("auth.registerKicker")}
      </p>
      <h1 className="mt-3 font-display text-4xl text-foam">
        {mode === "login" ? t("auth.loginTitle") : t("auth.registerTitle")}
      </h1>
      <p className="mt-3 text-sm text-mist">{t("auth.body")}</p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <label className="block text-sm">
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-mist">
            {t("auth.email")}
          </span>
          <input
            className="field mt-1"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className="block text-sm">
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-mist">
            {t("auth.password")}
          </span>
          <input
            className="field mt-1"
            type="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {error ? <p className="text-sm text-copper">{error}</p> : null}
        <button type="submit" className="btn-primary w-full" disabled={busy}>
          {busy
            ? t("auth.wait")
            : mode === "login"
              ? t("auth.login")
              : t("auth.register")}
        </button>
      </form>

      <p className="mt-6 text-sm text-mist">
        {mode === "login" ? (
          <>
            {t("auth.noAccount")}{" "}
            <button
              type="button"
              className="text-celadon hover:underline"
              onClick={() => {
                setMode("register");
                setError(null);
                router.replace("/account");
              }}
            >
              {t("nav.register")}
            </button>
          </>
        ) : (
          <>
            {t("auth.hasAccount")}{" "}
            <button
              type="button"
              className="text-celadon hover:underline"
              onClick={() => {
                setMode("login");
                setError(null);
                router.replace("/account?mode=login");
              }}
            >
              {t("nav.login")}
            </button>
          </>
        )}
      </p>
    </div>
  );
}
