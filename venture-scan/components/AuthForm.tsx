"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");
      router.push("/collection");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md px-4 py-16 sm:px-6">
      <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-celadon">
        {mode === "login" ? "Sign in" : "Create account"}
      </p>
      <h1 className="mt-3 font-display text-4xl text-foam">
        {mode === "login" ? "Welcome back" : "Join VentureScan"}
      </h1>
      <p className="mt-3 text-sm text-mist">
        Email and password access so you can collect ideas and matching analysis.
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <label className="block text-sm">
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-mist">
            Email
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
            Password
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
          {busy ? "Please wait…" : mode === "login" ? "Log in" : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-sm text-mist">
        {mode === "login" ? (
          <>
            No account yet?{" "}
            <Link href="/register" className="text-celadon hover:underline">
              Register
            </Link>
          </>
        ) : (
          <>
            Already registered?{" "}
            <Link href="/login" className="text-celadon hover:underline">
              Log in
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
