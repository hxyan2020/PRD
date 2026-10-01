"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

const DEMOS = [
  { email: "risk.owner@vantagemarkets.com", password: "risk123", label: "Risk Owner" },
  { email: "ops.lead@vantagemarkets.com", password: "ops123", label: "Ops Lead" },
  { email: "ai.engineer@vantagemarkets.com", password: "ai123", label: "AI Engineer" },
  { email: "system.admin@vantagemarkets.com", password: "sys123", label: "System Admin" },
  { email: "admin@vantagemarkets.com", password: "admin123", label: "Super Admin" },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState(DEMOS[0].email);
  const [password, setPassword] = useState(DEMOS[0].password);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
      setError(data.error || "Login failed");
      return;
    }
    router.push("/admin");
    router.refresh();
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <section className="relative overflow-hidden bg-[linear-gradient(145deg,#0f2438_0%,#0b6e6a_55%,#c45c26_120%)] text-white p-10 flex flex-col justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-teal-100/80">Vantage Markets</div>
          <h1 className="mt-4 font-[family-name:var(--font-display)] text-4xl leading-tight max-w-md">
            Centralised Risk Management Platform
          </h1>
          <p className="mt-4 max-w-md text-teal-50/90 text-sm leading-relaxed">
            Admin control plane for Risk Control, Operations, AI and System — wired to Monitor 2.0
            indicators and Lark escalations across CFD and crypto exchange products.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl bg-white/10 border border-white/15 p-4">
            <div className="text-teal-100 text-xs uppercase tracking-wide">Upstream</div>
            <div className="mt-1 font-semibold">Monitor 2.0</div>
            <div className="text-teal-50/80 text-xs mt-1">Indicators · Alerts · Tickets</div>
          </div>
          <div className="rounded-xl bg-white/10 border border-white/15 p-4">
            <div className="text-teal-100 text-xs uppercase tracking-wide">Messenger</div>
            <div className="mt-1 font-semibold">Lark</div>
            <div className="text-teal-50/80 text-xs mt-1">Escalation · On-call · ChatOps</div>
          </div>
        </div>
      </section>

      <section className="flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <h2 className="font-[family-name:var(--font-display)] text-2xl">Sign in to Admin</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">Prototype credentials — select a role persona below.</p>

          <form onSubmit={onSubmit} className="mt-6 panel p-5 space-y-4">
            <div>
              <label className="label">Email</label>
              <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                className="input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && <div className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">{error}</div>}
            <button className="btn btn-primary w-full justify-center" disabled={loading}>
              {loading ? "Signing in…" : "Enter Admin"}
            </button>
          </form>

          <div className="mt-4 flex flex-wrap gap-2">
            {DEMOS.map((d) => (
              <button
                key={d.email}
                type="button"
                className="btn"
                onClick={() => {
                  setEmail(d.email);
                  setPassword(d.password);
                }}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
