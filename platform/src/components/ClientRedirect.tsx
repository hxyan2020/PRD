"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Client-side replace so GitHub Pages static export can still honour old bookmarks. */
export function ClientRedirect({ href }: { href: string }) {
  const router = useRouter();
  useEffect(() => {
    router.replace(href);
  }, [href, router]);
  return <p className="text-sm text-[var(--muted)]">Redirecting…</p>;
}
