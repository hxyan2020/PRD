"use client";

import { Badge } from "@/components/ui";
import { useUiLocale } from "@/hooks/useUiLocale";
import { ownerBadgeLabel } from "@/lib/platform-owner";

export function OwnerBadge({ className }: { className?: string }) {
  const { locale } = useUiLocale();
  return (
    <Badge className={`bg-orange-50 text-orange-900 border-orange-200 ${className || ""}`}>
      {ownerBadgeLabel(locale)}
    </Badge>
  );
}
