"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type User = { id: string; email: string };

export function AuthNav() {
  const router = useRouter();
  const [user, setUser] = useState<User | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (!cancelled) setUser(data.user ?? null);
      } catch {
        if (!cancelled) setUser(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    router.push("/");
    router.refresh();
  }

  if (user === undefined) {
    return <span className="text-sm text-mist/50">…</span>;
  }

  if (!user) {
    return (
      <>
        <Link href="/login" className="hover:text-foam">
          Log in
        </Link>
        <Link href="/register" className="hover:text-foam">
          Register
        </Link>
      </>
    );
  }

  return (
    <>
      <Link href="/collection" className="hover:text-foam">
        Collection
      </Link>
      <span className="hidden max-w-[10rem] truncate text-xs text-mist/80 sm:inline" title={user.email}>
        {user.email}
      </span>
      <button type="button" onClick={() => void logout()} className="hover:text-foam">
        Log out
      </button>
    </>
  );
}
