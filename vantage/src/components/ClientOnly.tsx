"use client";

import { Suspense, type ReactNode } from "react";

export function ClientOnly({ children }: { children: ReactNode }) {
  return <Suspense fallback={<p className="text-muted">Loading desk…</p>}>{children}</Suspense>;
}
