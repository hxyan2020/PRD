import type { NewsCategory, Sector } from "./types";

export function parseCategory(
  value: string | undefined,
): "all" | NewsCategory {
  if (
    value === "listing" ||
    value === "product" ||
    value === "regulation" ||
    value === "risk_tools"
  ) {
    return value;
  }
  return "all";
}

export function parseSector(value: string | undefined): "all" | Sector {
  if (value === "banks" || value === "brokers" || value === "crypto") {
    return value;
  }
  return "all";
}
