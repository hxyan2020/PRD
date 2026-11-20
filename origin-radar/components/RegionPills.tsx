import type { GapStatus, RegionId, RegionalMarket } from "@/lib/types";
import { pct, regionShort, statusLabel } from "@/lib/format";

export function RegionPills({ markets }: { markets: RegionalMarket[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {markets.map((m) => (
        <span
          key={m.region}
          className={`chip ${
            !m.exists || m.status === "whitespace"
              ? "chip-gold"
              : m.status === "thin"
                ? "chip-signal"
                : m.status === "saturated"
                  ? ""
                  : "chip-rust"
          }`}
          title={statusLabel(m.status, m.exists)}
        >
          {regionShort(m.region as RegionId)}{" "}
          {!m.exists || m.status === "whitespace" ? "gap" : pct(m.marginPct)}
        </span>
      ))}
    </div>
  );
}

export function statusClass(status: GapStatus, exists: boolean): string {
  if (!exists || status === "whitespace") return "chip-gold";
  if (status === "thin") return "chip-signal";
  if (status === "saturated") return "";
  return "chip-rust";
}
