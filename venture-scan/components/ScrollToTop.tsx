"use client";

import { useLayoutEffect } from "react";

/** Force the window to the top when an idea dossier (or any keyed page) opens. */
export function ScrollToTop({ pageKey }: { pageKey: string }) {
  useLayoutEffect(() => {
    const pin = () => {
      if (typeof window === "undefined") return;
      const { history } = window;
      // Stop the browser from restoring the previous list scroll position.
      if ("scrollRestoration" in history) {
        history.scrollRestoration = "manual";
      }
      // Override global CSS `scroll-behavior: smooth` for an instant top pin.
      const root = document.documentElement;
      const prev = root.style.scrollBehavior;
      root.style.scrollBehavior = "auto";
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      root.scrollTop = 0;
      document.body.scrollTop = 0;
      document.getElementById("idea-top")?.scrollIntoView({ block: "start", behavior: "auto" });
      root.style.scrollBehavior = prev;
    };

    pin();
    // Next.js occasionally restores scroll after the first paint — pin again.
    const raf = requestAnimationFrame(pin);
    const t = window.setTimeout(pin, 0);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(t);
    };
  }, [pageKey]);

  return null;
}
