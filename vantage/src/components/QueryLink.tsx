"use client";

import type { MouseEvent, ReactNode } from "react";
import { navigateQuery } from "@/lib/queryNav";

export function QueryLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      className={className}
      onClick={(event: MouseEvent<HTMLAnchorElement>) => {
        if (
          event.defaultPrevented ||
          event.button !== 0 ||
          event.metaKey ||
          event.altKey ||
          event.ctrlKey ||
          event.shiftKey
        ) {
          return;
        }
        event.preventDefault();
        navigateQuery(href);
      }}
    >
      {children}
    </a>
  );
}
