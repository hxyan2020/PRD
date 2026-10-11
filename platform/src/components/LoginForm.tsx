"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useUiLocale } from "@/hooks/useUiLocale";
import { t } from "@/lib/i18n";
import {
  DEMO_PERSONAS,
  defaultPersona,
  findPersona,
  signInPersona,
} from "@/lib/demo-session";

export function LoginForm({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const { locale } = useUiLocale();
  const initial = defaultPersona();
  const [email, setEmail] = useState(initial.email);
  const [password, setPassword] = useState(initial.password);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const persona = findPersona(email, password);
    if (!persona) {
      setLoading(false);
      setError(t("login.failed", locale));
      return;
    }
    const ok = await signInPersona(persona);
    setLoading(false);
    if (!ok) {
      setError(t("login.failed", locale));
      return;
    }
    router.push("/admin");
    router.refresh();
  }

  return (
    <div className={compact ? "" : "w-full max-w-md"}>
      <form onSubmit={onSubmit} className="panel p-5 space-y-4">
        <div>
          <label className="label">{t("login.email", locale)}</label>
          <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" />
        </div>
        <div>
          <label className="label">{t("login.password", locale)}</label>
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </div>
        {error && (
          <div className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">{error}</div>
        )}
        <button className="btn btn-primary w-full justify-center" disabled={loading}>
          {loading
            ? locale === "zh-Hant"
              ? "登入中…"
              : "Signing in…"
            : t("login.submit", locale)}
        </button>
      </form>

      <div className="mt-3 text-xs text-[var(--muted)]">{t("login.demoRoles", locale)}</div>
      <div className="mt-2 action-row">
        {DEMO_PERSONAS.map((d) => (
          <button
            key={d.email}
            type="button"
            className="btn flex-1 sm:flex-none"
            onClick={() => {
              setEmail(d.email);
              setPassword(d.password);
            }}
          >
            {locale === "zh-Hant" ? d.labelZh : d.labelEn}
          </button>
        ))}
      </div>
    </div>
  );
}
