/** Canonical industry → icon glyph id used by IndustryIcon / IndustryPicker. */
export const INDUSTRY_ICON_IDS = [
  "all",
  "ai",
  "agritech",
  "climate",
  "cyber",
  "devtools",
  "ecommerce",
  "edtech",
  "energy",
  "enterprise",
  "fintech",
  "food",
  "hr",
  "health",
  "legal",
  "logistics",
  "manufacturing",
  "martech",
  "media",
  "mobility",
  "productivity",
  "saas",
  "generic",
] as const;

export type IndustryIconId = (typeof INDUSTRY_ICON_IDS)[number];

const BY_INDUSTRY: Record<string, IndustryIconId> = {
  AI: "ai",
  AgriTech: "agritech",
  "Climate Tech": "climate",
  Cybersecurity: "cyber",
  DevTools: "devtools",
  "E-commerce": "ecommerce",
  EdTech: "edtech",
  Energy: "energy",
  "Enterprise Software": "enterprise",
  FinTech: "fintech",
  "Food Tech": "food",
  "HR Tech": "hr",
  "Health Tech": "health",
  "Legal Tech": "legal",
  "Logistics Tech": "logistics",
  Manufacturing: "manufacturing",
  MarTech: "martech",
  Media: "media",
  Mobility: "mobility",
  Productivity: "productivity",
  SaaS: "saas",
};

export function industryIconId(industry: string): IndustryIconId {
  if (!industry) return "all";
  return BY_INDUSTRY[industry] ?? "generic";
}
