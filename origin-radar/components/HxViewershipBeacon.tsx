"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function HxViewershipBeacon() {
  const pathname = usePathname();
  useEffect(() => {
    const path = pathname || "/";
    fetch(`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/api/hx/viewership`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ path }),
      keepalive: true,
    }).catch(() => {});
  }, [pathname]);
  return null;
}
