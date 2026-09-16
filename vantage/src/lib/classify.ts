import type {
  Entity,
  Impact,
  NewsCategory,
  RiskTool,
  Sector,
} from "./types";

const LISTING =
  /\b(list(ed|ing|s)?|delist(ed|ing)?|new (token|coin|pair|market|contract|instrument|ticker|etf|perpetual)|perpetual|futures contract|options on|spot[- ]listed|trading pair|will list|now available to trade)\b/i;

const PRODUCT =
  /\b(launch(es|ed|ing)?|roll(s|ed|ing)? out|unveil(s|ed|ing)?|introduc(es|ed|ing)|new (feature|order type|product|platform|app|website|dashboard|market)|order type|iceberg|twap|vwap|copy trading|earn|staking|margin upgrade|mobile app|ui (refresh|redesign)|prime brokerage)\b/i;

const REGULATION =
  /\b(sec|cftc|fca|pra|esma|ecb|eba|mica|mifid|basel|occ|fdic|fincen|finra|mas|sfc|hkma|jfsa|csrc|pboc|nra|osfi|asic|finma|bafin|amf|consob|enforcement|consent order|consultation|rulemaking|guidance|license|authoris|capital rule|stablecoin act|genius act|clarity act)\b/i;

const RISK =
  /\b(surveillance|market abuse|aml|kyc|kyt|var\b|stress test|risk (management|platform|engine|system|tool)|monitoring tool|chainalysis|elliptic|actimize|aladdin|murex|axiomsl|smarts|validus|world-check|transaction monitoring|sanctions screen)\b/i;

const ASSET_PATTERNS: Array<[RegExp, string]> = [
  [/\bbitcoin|\bbtc\b/i, "BTC"],
  [/\bethereum|\beth\b/i, "ETH"],
  [/\bstablecoin|usdc|usdt|tether|circle/i, "stablecoins"],
  [/\btokeni[sz]ed|rwa\b/i, "tokenized assets / RWAs"],
  [/\betf\b/i, "ETFs"],
  [/\bperpetual|perps?\b/i, "crypto perpetuals"],
  [/\boption/i, "options"],
  [/\bfutures?\b/i, "futures"],
  [/\bswap/i, "swaps"],
  [/\bmortgage|mbs\b/i, "mortgages / MBS"],
  [/\btreasury|ust\b|gilts?\b/i, "government bonds"],
  [/\bequit(y|ies)|stock(s)?\b/i, "equities"],
  [/\bfx\b|foreign exchange|currency/i, "FX"],
  [/\bcommodity|oil|gold/i, "commodities"],
];

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function mentioned(text: string, aliases: string[]): boolean {
  return aliases.some((alias) => {
    const trimmed = alias.trim();
    if (trimmed.length < 2) return false;
    const pattern =
      trimmed.length <= 4
        ? new RegExp(`\\b${escapeRegExp(trimmed)}\\b`, "i")
        : new RegExp(escapeRegExp(trimmed), "i");
    return pattern.test(text);
  });
}

export function classifyCategory(
  text: string,
  sourceCategories: NewsCategory[],
): NewsCategory {
  const scores: Record<NewsCategory, number> = {
    listing: LISTING.test(text) ? 3 : 0,
    product: PRODUCT.test(text) ? 2 : 0,
    regulation: REGULATION.test(text) ? 3 : 0,
    risk_tools: RISK.test(text) ? 3 : 0,
  };

  if (sourceCategories.length === 1) {
    scores[sourceCategories[0]] += 1;
  }

  const ranked = (Object.entries(scores) as Array<[NewsCategory, number]>).sort(
    (a, b) => b[1] - a[1],
  );

  if (ranked[0][1] === 0) {
    return sourceCategories[0] ?? "product";
  }
  return ranked[0][0];
}

export function matchEntities(text: string, entities: Entity[]): string[] {
  const hits = entities
    .filter((entity) => mentioned(text, [entity.name, ...entity.aliases]))
    .map((entity) => entity.id);
  return [...new Set(hits)];
}

export function matchRiskTools(text: string, tools: RiskTool[]): string[] {
  return tools
    .filter((tool) => mentioned(text, [tool.name, ...tool.aliases]))
    .map((tool) => tool.id);
}

export function inferSectors(
  text: string,
  entityIds: string[],
  entities: Entity[],
  sourceSectors: Array<Sector | "cross">,
): Sector[] {
  const fromEntities = entityIds
    .map((id) => entities.find((entity) => entity.id === id)?.sector)
    .filter((sector): sector is Sector => Boolean(sector));

  const hinted: Sector[] = [];
  if (/\bcrypto|digital asset|bitcoin|stablecoin|token|exchange\b/i.test(text)) {
    hinted.push("crypto");
  }
  if (/\bbroker-dealer|brokerage|finra|retail investor|cfd\b/i.test(text)) {
    hinted.push("brokers");
  }
  if (/\bbank|basel|gsib|capital ratio|deposit\b/i.test(text)) {
    hinted.push("banks");
  }

  const fromSource = sourceSectors.filter(
    (sector): sector is Sector => sector !== "cross",
  );

  const merged = [...new Set([...fromEntities, ...hinted, ...fromSource])];
  return merged.length ? merged : ["banks", "brokers", "crypto"];
}

export function inferImpact(
  text: string,
  category: NewsCategory,
  sectors: Sector[],
): Impact | null {
  if (category !== "regulation") return null;

  const assets = ASSET_PATTERNS.filter(([pattern]) => pattern.test(text)).map(
    ([, label]) => label,
  );

  const uniqueAssets = [...new Set(assets)];
  return buildImpact(sectors, uniqueAssets);
}

export function buildImpact(sectors: Sector[], uniqueAssets: string[]): Impact {
  const sectorEn = sectors.join(", ");
  const sectorZhMap: Record<string, string> = {
    banks: "银行",
    brokers: "券商",
    crypto: "加密交易所",
  };
  const sectorZh = sectors.map((sector) => sectorZhMap[sector] ?? sector).join("、");
  const assetZhMap: Record<string, string> = {
    BTC: "比特币",
    ETH: "以太坊",
    stablecoins: "稳定币",
    "tokenized assets / RWAs": "代币化资产 / RWA",
    ETFs: "ETF",
    "crypto perpetuals": "加密永续合约",
    options: "期权",
    futures: "期货",
    swaps: "互换",
    "mortgages / MBS": "按揭 / MBS",
    "government bonds": "国债",
    equities: "股票",
    FX: "外汇",
    commodities: "大宗商品",
  };
  const assetEn = uniqueAssets.length
    ? ` Focus assets: ${uniqueAssets.join(", ")}.`
    : "";
  const assetZh = uniqueAssets.length
    ? ` 关注资产：${uniqueAssets.map((asset) => assetZhMap[asset] ?? asset).join("、")}。`
    : "";

  return {
    sectors,
    assets: uniqueAssets,
    summary: `Potential impact on ${sectorEn}.${assetEn}`,
    summaryZh: `对${sectorZh}的潜在影响。${assetZh}`,
  };
}

export function inferJurisdictions(
  text: string,
  sourceJurisdictions: string[],
): string[] {
  const map: Array<[RegExp, string]> = [
    [/\bSEC\b|\bCFTC\b|\bOCC\b|\bFederal Reserve\b|\bFinCEN\b|\bUnited States\b|\bU\.S\./i, "United States"],
    [/\bFCA\b|\bPRA\b|\bBank of England\b|\bUnited Kingdom\b|\bUK\b/i, "United Kingdom"],
    [/\bESMA\b|\bECB\b|\bEBA\b|\bMiCA\b|\bMiFID\b|\bEuropean Union\b|\bEU\b/i, "European Union"],
    [/\bMAS\b|\bSingapore\b/i, "Singapore"],
    [/\bJFSA\b|\bJapan FSA\b|\bFSA\b|\bBank of Japan\b|\bTokyo\b/i, "Japan"],
    [/\bSFC\b|\bHKMA\b|\bHong Kong\b/i, "Hong Kong"],
    [/\bCSRC\b|\bPBOC\b|\bNFRA\b|\bChina\b/i, "China"],
    [/\bASIC\b|\bAustralia\b/i, "Australia"],
    [/\bOSFI\b|\bOSC\b|\bCanada\b/i, "Canada"],
    [/\bFINMA\b|\bSwitzerland\b/i, "Switzerland"],
    [/\bBaFin\b|\bGermany\b/i, "Germany"],
    [/\bVARA\b|\bADGM\b|\bDFSA\b|\bDubai\b|\bUAE\b/i, "United Arab Emirates"],
  ];

  const found = map
    .filter(([pattern]) => pattern.test(text))
    .map(([, name]) => name);

  return [...new Set([...found, ...sourceJurisdictions])];
}
