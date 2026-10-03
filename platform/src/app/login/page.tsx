"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useUiLocale } from "@/hooks/useUiLocale";
import { t, type UiLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const DEMOS = [
  { email: "risk.owner@vantagemarkets.com", password: "risk123", labelEn: "Risk Owner", labelZh: "風險負責人" },
  { email: "ops.lead@vantagemarkets.com", password: "ops123", labelEn: "Ops Lead", labelZh: "營運主管" },
  { email: "ai.engineer@vantagemarkets.com", password: "ai123", labelEn: "AI Engineer", labelZh: "AI 工程師" },
  { email: "system.admin@vantagemarkets.com", password: "sys123", labelEn: "System Admin", labelZh: "系統管理員" },
  { email: "admin@vantagemarkets.com", password: "admin123", labelEn: "Super Admin", labelZh: "超級管理員" },
];

export default function LoginPage() {
  const router = useRouter();
  const { locale, setLocale } = useUiLocale();
  const [email, setEmail] = useState(DEMOS[0].email);
  const [password, setPassword] = useState(DEMOS[0].password);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function pickLang(next: UiLocale) {
    setLocale(next);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || t("login.failed", locale));
      return;
    }
    router.push("/admin");
    router.refresh();
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <section className="relative overflow-hidden bg-[linear-gradient(145deg,#0f2438_0%,#0b6e6a_55%,#c45c26_120%)] text-white p-6 sm:p-10 flex flex-col justify-between min-h-[42vh] lg:min-h-screen">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-teal-100/80">Vantage Markets</div>
          <h1 className="mt-3 sm:mt-4 font-[family-name:var(--font-display)] text-3xl sm:text-4xl leading-tight max-w-md">
            {t("login.title", locale)}
          </h1>
          <p className="mt-3 sm:mt-4 max-w-md text-teal-50/90 text-sm leading-relaxed">{t("login.blurb", locale)}</p>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-2 sm:gap-3 text-sm">
          <div className="rounded-xl bg-white/10 border border-white/15 p-3 sm:p-4">
            <div className="text-teal-100 text-xs uppercase tracking-wide">
              {locale === "zh-Hant" ? "上游" : "Upstream"}
            </div>
            <div className="mt-1 font-semibold">Monitor 2.0</div>
            <div className="text-teal-50/80 text-xs mt-1">
              {locale === "zh-Hant" ? "指標 · 警報 · 工單" : "Indicators · Alerts · Tickets"}
            </div>
          </div>
          <div className="rounded-xl bg-white/10 border border-white/15 p-3 sm:p-4">
            <div className="text-teal-100 text-xs uppercase tracking-wide">
              {locale === "zh-Hant" ? "即時通訊" : "Messenger"}
            </div>
            <div className="mt-1 font-semibold">Lark</div>
            <div className="text-teal-50/80 text-xs mt-1">
              {locale === "zh-Hant" ? "升級 · 值班 · ChatOps" : "Escalation · On-call · ChatOps"}
            </div>
          </div>
        </div>
      </section>

      <section className="flex items-center justify-center p-4 sm:p-8 pb-[max(1.5rem,var(--safe-bottom))]">
        <div className="w-full max-w-md">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="text-xs uppercase tracking-[0.12em] text-[var(--muted)]">
              {t("shell.language", locale)}
            </div>
            <div className="relative z-10 flex gap-1" role="group" aria-label={t("shell.language", locale)}>
              <button
                type="button"
                className={cn("btn !min-h-9 !px-3 text-xs relative z-10", locale === "en" ? "btn-primary" : "")}
                onClick={() => pickLang("en")}
              >
                English
              </button>
              <button
                type="button"
                className={cn("btn !min-h-9 !px-3 text-xs relative z-10", locale === "zh-Hant" ? "btn-primary" : "")}
                onClick={() => pickLang("zh-Hant")}
              >
                繁體中文
              </button>
            </div>
          </div>
          <h2 className="font-[family-name:var(--font-display)] text-xl sm:text-2xl">{t("login.signIn", locale)}</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">{t("login.hint", locale)}</p>
          <a href="/admin" className="btn btn-primary mt-4 w-full justify-center">
            {locale === "zh-Hant" ? "無需登入，進入後台" : "Enter admin without signing in"}
          </a>

          <form onSubmit={onSubmit} className="mt-6 panel p-5 space-y-4">
            <div>
              <label className="label">{t("login.email", locale)}</label>
              <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <label className="label">{t("login.password", locale)}</label>
              <input
                className="input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
            {DEMOS.map((d) => (
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
      </section>
    </div>
  );
}
