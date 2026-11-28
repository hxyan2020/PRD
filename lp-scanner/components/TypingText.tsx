"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  text: string;
  active?: boolean;
  cps?: number;
  className?: string;
  onDone?: () => void;
};

/** Character typing effect for quality-step narratives. */
export function TypingText({ text, active = true, cps = 48, className, onDone }: Props) {
  const [n, setN] = useState(active ? 0 : text.length);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    if (!active) {
      setN(text.length);
      return;
    }
    setN(0);
    if (!text) {
      onDoneRef.current?.();
      return;
    }
    const interval = Math.max(10, Math.round(1000 / cps));
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setN(i);
      if (i >= text.length) {
        window.clearInterval(id);
        onDoneRef.current?.();
      }
    }, interval);
    return () => window.clearInterval(id);
  }, [text, active, cps]);

  const shown = text.slice(0, n);
  const done = n >= text.length;

  return (
    <span className={className}>
      {shown}
      {active && !done && (
        <span className="ml-0.5 inline-block h-[1em] w-[2px] translate-y-[2px] bg-teal animate-pulse" />
      )}
    </span>
  );
}
