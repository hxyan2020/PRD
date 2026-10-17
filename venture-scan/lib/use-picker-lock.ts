"use client";

import { useEffect } from "react";

/** Lock body scroll while a mobile filter sheet is open. */
export function usePickerLock(open: boolean) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);
}
