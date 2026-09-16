"use client";

import { useHasMounted } from "@/lib/queryNav";
import type { ReactNode } from "react";

export function ClientOnly({ children }: { children: ReactNode }) {
  const mounted = useHasMounted();
  if (!mounted) {
    return <p className="text-muted">Loading desk…</p>;
  }
  return <>{children}</>;
}
