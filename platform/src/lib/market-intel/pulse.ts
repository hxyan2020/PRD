import type { AssetClass } from "@/lib/market-intel/sources";

export type PulseFinding = {
  finding_id: string;
  event_title: string;
  event_summary: string;
  geography: string;
  severity: string;
  products_json: string;
  scanned_at: string;
};

export type CoreInstrument = {
  symbol: string;
  name: string;
  name_zh: string;
  asset_class: AssetClass;
};

/** Core CFD / crypto symbols Vantage desks quote. */
export const VANTAGE_CORE_INSTRUMENTS: CoreInstrument[] = [
  { symbol: "EURUSD", name: "Euro / US Dollar", name_zh: "歐元／美元", asset_class: "FOREX" },
  { symbol: "GBPUSD", name: "Pound / US Dollar", name_zh: "英鎊／美元", asset_class: "FOREX" },
  { symbol: "USDJPY", name: "US Dollar / Yen", name_zh: "美元／日圓", asset_class: "FOREX" },
  { symbol: "AUDUSD", name: "Aussie / US Dollar", name_zh: "澳元／美元", asset_class: "FOREX" },
  { symbol: "USDCAD", name: "US Dollar / Canadian Dollar", name_zh: "美元／加元", asset_class: "FOREX" },
  { symbol: "USDCHF", name: "US Dollar / Swiss Franc", name_zh: "美元／瑞士法郎", asset_class: "FOREX" },
  { symbol: "NZDUSD", name: "Kiwi / US Dollar", name_zh: "紐元／美元", asset_class: "FOREX" },
  { symbol: "USDCNH", name: "US Dollar / Offshore Yuan", name_zh: "美元／離岸人民幣", asset_class: "FOREX" },
  { symbol: "EURGBP", name: "Euro / Pound", name_zh: "歐元／英鎊", asset_class: "FOREX" },
  { symbol: "XAUUSD", name: "Gold", name_zh: "黃金", asset_class: "COMMODITY" },
  { symbol: "XAUUSD247", name: "Gold 24/7", name_zh: "黃金 24/7", asset_class: "COMMODITY" },
  { symbol: "XAGUSD", name: "Silver", name_zh: "白銀", asset_class: "COMMODITY" },
  { symbol: "USOIL", name: "WTI Crude", name_zh: "WTI 原油", asset_class: "COMMODITY" },
  { symbol: "UKOIL", name: "Brent Crude", name_zh: "布倫特原油", asset_class: "COMMODITY" },
  { symbol: "NGAS", name: "Natural Gas", name_zh: "天然氣", asset_class: "COMMODITY" },
  { symbol: "NAS100", name: "Nasdaq 100", name_zh: "納斯達克 100", asset_class: "INDEX" },
  { symbol: "SPX500", name: "S&P 500", name_zh: "標普 500", asset_class: "INDEX" },
  { symbol: "US30", name: "Dow Jones", name_zh: "道瓊", asset_class: "INDEX" },
  { symbol: "UK100", name: "FTSE 100", name_zh: "英國富時 100", asset_class: "INDEX" },
  { symbol: "GER40", name: "DAX 40", name_zh: "德國 DAX 40", asset_class: "INDEX" },
  { symbol: "EU50", name: "Euro Stoxx 50", name_zh: "歐元區 Stoxx 50", asset_class: "INDEX" },
  { symbol: "AUS200", name: "ASX 200", name_zh: "澳洲 ASX 200", asset_class: "INDEX" },
  { symbol: "JPN225", name: "Nikkei 225", name_zh: "日經 225", asset_class: "INDEX" },
  { symbol: "HK50", name: "Hang Seng", name_zh: "恒生指數", asset_class: "INDEX" },
  { symbol: "BTCUSD", name: "Bitcoin", name_zh: "比特幣", asset_class: "CRYPTO" },
  { symbol: "ETHUSD", name: "Ether", name_zh: "以太幣", asset_class: "CRYPTO" },
  { symbol: "SOLUSD", name: "Solana", name_zh: "Solana", asset_class: "CRYPTO" },
  { symbol: "XRPUSD", name: "XRP", name_zh: "XRP", asset_class: "CRYPTO" },
];

export const PULSE_ASSET_ORDER: AssetClass[] = ["FOREX", "COMMODITY", "INDEX", "CRYPTO"];

const SYMBOL_ALIAS: Record<string, string> = {
  SP500: "SPX500",
  SPX: "SPX500",
  NDX: "NAS100",
  NASDAQ: "NAS100",
  USTEC: "NAS100",
  DJ30: "US30",
  DJI: "US30",
  WTI: "USOIL",
  BRENT: "UKOIL",
  GOLD: "XAUUSD",
  XAU: "XAUUSD",
  XAUUSD247: "XAUUSD247",
  SILVER: "XAGUSD",
  XAG: "XAGUSD",
  BTC: "BTCUSD",
  ETH: "ETHUSD",
  SOL: "SOLUSD",
  XRP: "XRPUSD",
  HSI: "HK50",
  DAX: "GER40",
  FTSE: "UK100",
  ASX200: "AUS200",
  NKY: "JPN225",
  NATGAS: "NGAS",
};

export type SentimentTone = "BULLISH" | "BEARISH" | "MIXED" | "NEUTRAL";

export type InstrumentSentiment = {
  symbol: string;
  name: string;
  name_zh: string;
  asset_class: AssetClass;
  score: number;
  tone: SentimentTone;
  hits_1h: number;
  hits_24h: number;
  last_direction: "UP" | "DOWN" | "VOLATILE" | null;
};

export type PulseEvent = {
  finding_id: string;
  event_title: string;
  event_summary: string;
  geography: string;
  severity: string;
  scanned_at: string;
  products: string[];
};

export type MarketPulse = {
  hour: PulseEvent | null;
  day: PulseEvent | null;
  instruments: InstrumentSentiment[];
  anchored: boolean;
};

const SEV_W: Record<string, number> = { CRITICAL: 4, BREACH: 3, WARN: 2, INFO: 1 };
const DIR_W: Record<string, number> = { UP: 1, DOWN: -1, VOLATILE: 0 };

export function parseFindingTime(raw: string): number {
  if (!raw) return 0;
  const t = Date.parse(raw.includes("T") ? raw : `${raw.replace(" ", "T")}Z`);
  return Number.isFinite(t) ? t : 0;
}

function parseProducts(json: string): Array<{ product: string; direction: string }> {
  try {
    const v = JSON.parse(json || "[]");
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

export function normalizeProductSymbol(raw: string): string {
  const u = String(raw || "")
    .toUpperCase()
    .replace(/\.F$/i, "")
    .replace(/[^A-Z0-9]/g, "");
  return SYMBOL_ALIAS[u] || u;
}

export function findingMentionsSymbol(productsJson: string, symbol: string): boolean {
  const want = normalizeProductSymbol(symbol);
  return parseProducts(productsJson).some((p) => normalizeProductSymbol(p.product) === want);
}

/** Frozen GitHub Pages snapshots use the latest finding as "now" so hour/day windows still fill. */
export function pulseClock(findings: PulseFinding[], now = Date.now()): { now: number; anchored: boolean } {
  let latest = 0;
  for (const f of findings) {
    const ts = parseFindingTime(f.scanned_at);
    if (ts > latest) latest = ts;
  }
  if (latest > 0 && now - latest > 24 * 60 * 60 * 1000) return { now: latest, anchored: true };
  return { now, anchored: false };
}

function pickMainEvent(list: PulseFinding[]): PulseEvent | null {
  if (!list.length) return null;
  const ranked = [...list].sort((a, b) => {
    const sw = (SEV_W[b.severity] ?? 0) - (SEV_W[a.severity] ?? 0);
    if (sw) return sw;
    return parseFindingTime(b.scanned_at) - parseFindingTime(a.scanned_at);
  });
  const f = ranked[0];
  return {
    finding_id: f.finding_id,
    event_title: f.event_title,
    event_summary: f.event_summary,
    geography: f.geography,
    severity: f.severity,
    scanned_at: f.scanned_at,
    products: parseProducts(f.products_json).map((p) => p.product).filter(Boolean),
  };
}

function toneFor(score: number, hits: number, volatileShare: number): SentimentTone {
  if (hits === 0) return "NEUTRAL";
  if (volatileShare >= 0.55 && Math.abs(score) < 25) return "MIXED";
  if (score >= 18) return "BULLISH";
  if (score <= -18) return "BEARISH";
  if (hits >= 2) return "MIXED";
  return "NEUTRAL";
}

export function buildMarketPulse(findings: PulseFinding[], wallNow = Date.now()): MarketPulse {
  const { now, anchored } = pulseClock(findings, wallNow);
  const hourCut = now - 60 * 60 * 1000;
  const dayCut = now - 24 * 60 * 60 * 1000;
  const timed = findings
    .map((f) => ({ ...f, ts: parseFindingTime(f.scanned_at) }))
    .filter((f) => f.ts > 0);
  const hour = timed.filter((f) => f.ts >= hourCut);
  const day = timed.filter((f) => f.ts >= dayCut);

  const bySymbol = new Map<string, { w: number; abs: number; vol: number; n1: number; n24: number; lastDir: string | null; lastTs: number }>();
  for (const inst of VANTAGE_CORE_INSTRUMENTS) {
    bySymbol.set(inst.symbol, { w: 0, abs: 0, vol: 0, n1: 0, n24: 0, lastDir: null, lastTs: 0 });
  }

  for (const f of day) {
    const sev = SEV_W[f.severity] ?? 1;
    for (const p of parseProducts(f.products_json)) {
      const key = normalizeProductSymbol(p.product);
      const row = bySymbol.get(key);
      if (!row) continue;
      const dir = DIR_W[String(p.direction || "").toUpperCase()] ?? 0;
      row.w += dir * sev;
      row.abs += sev;
      row.n24 += 1;
      if (String(p.direction).toUpperCase() === "VOLATILE") row.vol += 1;
      if (f.ts >= hourCut) row.n1 += 1;
      if (f.ts >= row.lastTs) {
        row.lastTs = f.ts;
        row.lastDir = String(p.direction || "").toUpperCase();
      }
    }
  }

  const instruments: InstrumentSentiment[] = VANTAGE_CORE_INSTRUMENTS.map((inst) => {
    const row = bySymbol.get(inst.symbol)!;
    const score = row.abs ? Math.round((row.w / row.abs) * 100) : 0;
    const last =
      row.lastDir === "UP" || row.lastDir === "DOWN" || row.lastDir === "VOLATILE" ? row.lastDir : null;
    return {
      symbol: inst.symbol,
      name: inst.name,
      name_zh: inst.name_zh,
      asset_class: inst.asset_class,
      score,
      tone: toneFor(score, row.n24, row.n24 ? row.vol / row.n24 : 0),
      hits_1h: row.n1,
      hits_24h: row.n24,
      last_direction: last,
    };
  });

  return {
    hour: pickMainEvent(hour),
    day: pickMainEvent(day),
    instruments,
    anchored,
  };
}
