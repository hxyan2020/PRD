"use client";

import { useState } from "react";
import { logoHref } from "@/lib/logos";

export function BrandLabel({
  id,
  name,
  size = "sm",
  className = "",
}: {
  id: string;
  name: string;
  size?: "sm" | "md";
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const box = size === "md" ? "h-7 w-7" : "h-5 w-5";

  return (
    <span className={`inline-flex items-center gap-2 ${className}`.trim()}>
      {failed ? null : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoHref(id)}
          alt=""
          width={size === "md" ? 28 : 20}
          height={size === "md" ? 28 : 20}
          data-logo={id}
          className={`${box} shrink-0 rounded-sm bg-paper object-contain p-0.5`}
          onError={() => setFailed(true)}
        />
      )}
      <span>{name}</span>
    </span>
  );
}

export function BrandLabelList({
  items,
  className = "",
}: {
  items: Array<{ id: string; name: string }>;
  className?: string;
}) {
  if (!items.length) return null;
  return (
    <span className={`inline-flex flex-wrap items-center gap-x-3 gap-y-1 ${className}`.trim()}>
      {items.map((item) => (
        <BrandLabel key={item.id} id={item.id} name={item.name} />
      ))}
    </span>
  );
}
