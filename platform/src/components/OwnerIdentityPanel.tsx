"use client";

import { VantageMark } from "@/components/VantageLogo";
import { EnZh } from "@/components/EnZh";
import { PLATFORM_OWNER } from "@/lib/platform-owner";

/** Static identity strip for Settings / docs catalogs. */
export function OwnerIdentityPanel() {
  return (
    <div className="panel p-4 mb-4 flex items-center gap-3">
      <VantageMark className="h-11 w-11" />
      <div className="min-w-0">
        <div className="text-xs uppercase tracking-[0.12em] text-[var(--muted)]">
          <EnZh en={PLATFORM_OWNER.titleEn} zh={PLATFORM_OWNER.titleZh} />
        </div>
        <div className="font-semibold text-lg mt-0.5">{PLATFORM_OWNER.name}</div>
        <div className="text-sm text-[var(--muted)] break-word">{PLATFORM_OWNER.email}</div>
      </div>
    </div>
  );
}
