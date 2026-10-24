"use client";

import { useEffect } from "react";

/** Scroll to a hash target after navigation (e.g. /ideas#yesterday). */
export function HashScroll({ hash }: { hash: string }) {
  useEffect(() => {
    const id = hash.replace(/^#/, "");
    if (!id) return;

    const pin = () => {
      const el = document.getElementById(id);
      if (!el) return false;
      if (typeof window !== "undefined" && "scrollRestoration" in window.history) {
        window.history.scrollRestoration = "manual";
      }
      el.scrollIntoView({ block: "start", behavior: "auto" });
      return true;
    };

    if (pin()) return;
    const raf = requestAnimationFrame(() => {
      pin();
    });
    const t1 = window.setTimeout(pin, 50);
    const t2 = window.setTimeout(pin, 200);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [hash]);

  return null;
}
