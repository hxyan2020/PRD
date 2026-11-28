import type { Locale, OptimalRegionCode } from "@/lib/types";

export type { OptimalRegionCode };

export type RegionMeta = {
  code: OptimalRegionCode;
  flag: string;
  labelEn: string;
  labelZh: string;
  labelZhTw: string;
};

export const REGION_META: Record<OptimalRegionCode, RegionMeta> = {
  UK: { code: "UK", flag: "🇬🇧", labelEn: "UK", labelZh: "英国", labelZhTw: "英國" },
  EU: { code: "EU", flag: "🇪🇺", labelEn: "EU", labelZh: "欧盟", labelZhTw: "歐盟" },
  US: { code: "US", flag: "🇺🇸", labelEn: "US", labelZh: "美国", labelZhTw: "美國" },
  SG: { code: "SG", flag: "🇸🇬", labelEn: "Singapore", labelZh: "新加坡", labelZhTw: "新加坡" },
  AU: {
    code: "AU",
    flag: "🇦🇺",
    labelEn: "Australia",
    labelZh: "澳大利亚",
    labelZhTw: "澳大利亞",
  },
  AE: {
    code: "AE",
    flag: "🇦🇪",
    labelEn: "UAE / Dubai",
    labelZh: "阿联酋 / 迪拜",
    labelZhTw: "阿聯酋 / 杜拜",
  },
  JP: { code: "JP", flag: "🇯🇵", labelEn: "Japan", labelZh: "日本", labelZhTw: "日本" },
  HK: { code: "HK", flag: "🇭🇰", labelEn: "Hong Kong", labelZh: "香港", labelZhTw: "香港" },
  CY: { code: "CY", flag: "🇨🇾", labelEn: "Cyprus", labelZh: "塞浦路斯", labelZhTw: "賽普勒斯" },
  ZA: { code: "ZA", flag: "🇿🇦", labelEn: "South Africa", labelZh: "南非", labelZhTw: "南非" },
  DK: { code: "DK", flag: "🇩🇰", labelEn: "Denmark", labelZh: "丹麦", labelZhTw: "丹麥" },
  GI: { code: "GI", flag: "🇬🇮", labelEn: "Gibraltar", labelZh: "直布罗陀", labelZhTw: "直布羅陀" },
  CA: { code: "CA", flag: "🇨🇦", labelEn: "Canada", labelZh: "加拿大", labelZhTw: "加拿大" },
  ASIA: { code: "ASIA", flag: "🌏", labelEn: "Asia", labelZh: "亚洲", labelZhTw: "亞洲" },
  GLOBAL: { code: "GLOBAL", flag: "🌐", labelEn: "Global", labelZh: "全球", labelZhTw: "全球" },
};

/** Optimal trading / coverage regions per seeded LP (desk fit, not legal footprint). */
export const LP_OPTIMAL_REGIONS: Record<string, OptimalRegionCode[]> = {
  finalto: ["UK", "EU", "SG", "AU", "AE"],
  "cmc-markets": ["UK", "AU", "SG", "EU", "CA"],
  velocity: ["ZA", "EU", "UK", "AU", "ASIA"],
  cfh: ["UK", "EU", "SG"],
  b2broker: ["EU", "ASIA", "GLOBAL"],
  isprime: ["UK", "EU", "AU", "GI"],
  broctagon: ["CY", "ASIA"],
  mahifx: ["UK", "GLOBAL"],
  "vantage-uk": ["UK"],
  bybit: ["AE", "ASIA", "GLOBAL"],
  binance: ["ASIA", "GLOBAL"],
  okx: ["ASIA", "AE", "GLOBAL"],
  kraken: ["US", "EU", "GLOBAL"],
  gateio: ["ASIA", "GLOBAL"],
  bitget: ["ASIA", "GLOBAL"],
  lmax: ["UK", "EU"],
  "advanced-markets": ["AU", "GLOBAL"],
  saxo: ["DK", "EU", "SG"],
  invast: ["AU", "JP", "ASIA"],
  onezero: ["GLOBAL"],
};

const REGION_CODES = new Set<string>(Object.keys(REGION_META));

function isOptimalRegionCode(value: string): value is OptimalRegionCode {
  return REGION_CODES.has(value);
}

export function resolveOptimalRegions(
  slug: string,
  stored?: OptimalRegionCode[] | string[],
): OptimalRegionCode[] {
  if (stored && stored.length > 0) {
    const out: OptimalRegionCode[] = [];
    for (const c of stored) {
      if (isOptimalRegionCode(c)) out.push(c);
    }
    if (out.length) return out;
  }
  return LP_OPTIMAL_REGIONS[slug] ?? ["GLOBAL"];
}

export function regionLabel(code: OptimalRegionCode, locale: Locale): string {
  const meta = REGION_META[code];
  if (locale === "zh-TW") return meta.labelZhTw;
  if (locale === "zh-CN") return meta.labelZh;
  return meta.labelEn;
}

export function formatOptimalRegions(
  codes: OptimalRegionCode[],
  locale: Locale,
): string {
  return codes.map((c) => `${REGION_META[c].flag} ${regionLabel(c, locale)}`).join(" · ");
}
