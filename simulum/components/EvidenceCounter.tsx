"use client";

import { useEffect, useState } from "react";

export function EvidenceCounter({ value }: { value: number }) {
  const [display, setDisplay] = useState(value);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (!hasMounted) return;
    let frame = 0;
    const start = performance.now();
    const from = Math.max(0, value - Math.min(value, 24));
    const to = value;
    const duration = 900;
    setDisplay(from);

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(from + (to - from) * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, hasMounted]);

  return (
    <p
      className="animate-count-pulse font-display text-[clamp(4.5rem,16vw,9rem)] leading-none tracking-tight text-ink"
      aria-live="polite"
    >
      <span className="count-digit tabular-nums">{display.toLocaleString()}</span>
    </p>
  );
}
