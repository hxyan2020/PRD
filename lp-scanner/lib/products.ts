import type { AssetClass } from "@/lib/types";

export type ProductProfile = {
  symbol: string;
  aliases: string[];
  assetClass: AssetClass;
  session: "24/5" | "24/7" | "mixed";
  scoreKey: keyof import("@/lib/types").LpRecord["scoreHints"];
  keywords: string[];
};

export const PRODUCT_PROFILES: ProductProfile[] = [
  {
    symbol: "XAUUSD",
    aliases: ["GOLD", "XAU", "GOLDUSD"],
    assetClass: "metals",
    session: "24/5",
    scoreKey: "gold",
    keywords: ["gold", "xau", "precious metal"],
  },
  {
    symbol: "XAGUSD",
    aliases: ["SILVER", "XAG"],
    assetClass: "metals",
    session: "24/5",
    scoreKey: "gold",
    keywords: ["silver", "xag"],
  },
  {
    symbol: "EURUSD",
    aliases: ["EUR/USD"],
    assetClass: "fx",
    session: "24/5",
    scoreKey: "fxMajors",
    keywords: ["eurusd", "fx major", "euro"],
  },
  {
    symbol: "GBPUSD",
    aliases: ["CABLE", "GBP/USD"],
    assetClass: "fx",
    session: "24/5",
    scoreKey: "fxMajors",
    keywords: ["gbpusd", "cable"],
  },
  {
    symbol: "USDJPY",
    aliases: ["USD/JPY"],
    assetClass: "fx",
    session: "24/5",
    scoreKey: "asia",
    keywords: ["usdjpy", "yen"],
  },
  {
    symbol: "US30",
    aliases: ["DJ30", "WALLSTREET", "DJI"],
    assetClass: "indices",
    session: "mixed",
    scoreKey: "indices",
    keywords: ["dow", "us30", "index"],
  },
  {
    symbol: "NAS100",
    aliases: ["USTEC", "NDX", "NASDAQ"],
    assetClass: "indices",
    session: "mixed",
    scoreKey: "indices",
    keywords: ["nasdaq", "nas100"],
  },
  {
    symbol: "UK100",
    aliases: ["FTSE", "UKX"],
    assetClass: "indices",
    session: "mixed",
    scoreKey: "indices",
    keywords: ["ftse", "uk100"],
  },
  {
    symbol: "USOIL",
    aliases: ["WTI", "CL", "CRUDE"],
    assetClass: "energies",
    session: "24/5",
    scoreKey: "oil",
    keywords: ["oil", "wti", "crude"],
  },
  {
    symbol: "BTCUSD",
    aliases: ["BTC", "BITCOIN", "BTCUSDT"],
    assetClass: "crypto",
    session: "24/7",
    scoreKey: "crypto",
    keywords: ["bitcoin", "btc", "crypto"],
  },
  {
    symbol: "ETHUSD",
    aliases: ["ETH", "ETHEREUM", "ETHUSDT"],
    assetClass: "crypto",
    session: "24/7",
    scoreKey: "crypto",
    keywords: ["ethereum", "eth"],
  },
  {
    symbol: "SOLUSD",
    aliases: ["SOL", "SOLUSDT"],
    assetClass: "crypto",
    session: "24/7",
    scoreKey: "crypto",
    keywords: ["solana", "sol"],
  },
];

export function resolveProduct(raw: string): ProductProfile | null {
  const q = raw.trim().toUpperCase().replace(/[\/\s-_]/g, "");
  if (!q) return null;
  for (const p of PRODUCT_PROFILES) {
    const keys = [p.symbol, ...p.aliases].map((s) => s.toUpperCase().replace(/[\/\s-_]/g, ""));
    if (keys.includes(q) || keys.some((k) => k.includes(q) || q.includes(k))) return p;
  }
  // Heuristic for unknown symbols
  if (q.includes("BTC") || q.includes("ETH") || q.endsWith("USDT")) {
    return {
      symbol: raw.trim().toUpperCase(),
      aliases: [],
      assetClass: "crypto",
      session: "24/7",
      scoreKey: "crypto",
      keywords: ["crypto", raw.toLowerCase()],
    };
  }
  if (q.startsWith("XAU") || q.includes("GOLD")) {
    return PRODUCT_PROFILES[0];
  }
  if (q.length === 6 && /^[A-Z]+$/.test(q)) {
    return {
      symbol: q,
      aliases: [],
      assetClass: "fx",
      session: "24/5",
      scoreKey: "fxMajors",
      keywords: ["fx", q.toLowerCase()],
    };
  }
  return {
    symbol: raw.trim().toUpperCase(),
    aliases: [],
    assetClass: "fx",
    session: "mixed",
    scoreKey: "fxMajors",
    keywords: [raw.toLowerCase()],
  };
}
