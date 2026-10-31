import { EVENT_ARTICLE_LINKS } from "@/lib/market-intel/article-links";

export type AssetClass = "FOREX" | "INDEX" | "COMMODITY" | "FUTURES" | "CRYPTO";

export type IntelSource = {
  source_key: string;
  name: string;
  channel_type: "NEWS" | "OFFICIAL" | "SOCIAL" | "EXCHANGE" | "DATA_VENDOR";
  asset_classes: AssetClass[];
  url: string;
};

/** Sources the scanner scrapes / polls every 5 minutes (prototype catalog). */
export const MARKET_INTEL_SOURCES: IntelSource[] = [
  {
    source_key: "reuters_markets",
    name: "Reuters Markets",
    channel_type: "NEWS",
    asset_classes: ["FOREX", "INDEX", "COMMODITY", "FUTURES"],
    url: "https://www.reuters.com/markets/",
  },
  {
    source_key: "bloomberg_fx",
    name: "Bloomberg FX",
    channel_type: "NEWS",
    asset_classes: ["FOREX", "INDEX"],
    url: "https://www.bloomberg.com/markets/currencies",
  },
  {
    source_key: "fed_press",
    name: "US Federal Reserve — Press",
    channel_type: "OFFICIAL",
    asset_classes: ["FOREX", "INDEX", "FUTURES", "COMMODITY"],
    url: "https://www.federalreserve.gov/newsevents.htm",
  },
  {
    source_key: "ecb_press",
    name: "ECB Press Releases",
    channel_type: "OFFICIAL",
    asset_classes: ["FOREX", "INDEX"],
    url: "https://www.ecb.europa.eu/press/pr/html/index.en.html",
  },
  {
    source_key: "boe_news",
    name: "Bank of England News",
    channel_type: "OFFICIAL",
    asset_classes: ["FOREX", "INDEX"],
    url: "https://www.bankofengland.co.uk/news",
  },
  {
    source_key: "pboc_en",
    name: "PBOC / SAFE (CN) Official",
    channel_type: "OFFICIAL",
    asset_classes: ["FOREX", "COMMODITY"],
    url: "http://www.pbc.gov.cn/en/",
  },
  {
    source_key: "opec_press",
    name: "OPEC Press",
    channel_type: "OFFICIAL",
    asset_classes: ["COMMODITY", "FUTURES"],
    url: "https://www.opec.org/opec_web/en/press_room/274.htm",
  },
  {
    source_key: "eia_petroleum",
    name: "EIA Petroleum Weekly",
    channel_type: "DATA_VENDOR",
    asset_classes: ["COMMODITY", "FUTURES"],
    url: "https://www.eia.gov/petroleum/",
  },
  {
    source_key: "cftc_cot",
    name: "CFTC Commitments of Traders",
    channel_type: "OFFICIAL",
    asset_classes: ["FUTURES", "COMMODITY", "FOREX"],
    url: "https://www.cftc.gov/MarketReports/CommitmentsofTraders/index.htm",
  },
  {
    source_key: "binance_ann",
    name: "Binance Announcements",
    channel_type: "EXCHANGE",
    asset_classes: ["CRYPTO"],
    url: "https://www.binance.com/en/support/announcement",
  },
  {
    source_key: "coinbase_blog",
    name: "Coinbase Blog / Status",
    channel_type: "EXCHANGE",
    asset_classes: ["CRYPTO"],
    url: "https://www.coinbase.com/blog",
  },
  {
    source_key: "coindesk",
    name: "CoinDesk",
    channel_type: "NEWS",
    asset_classes: ["CRYPTO"],
    url: "https://www.coindesk.com/",
  },
  {
    source_key: "x_fxhedge",
    name: "X / Twitter — FX Hedge accounts",
    channel_type: "SOCIAL",
    asset_classes: ["FOREX", "INDEX"],
    url: "https://twitter.com/search?q=FOMC%20OR%20NFP%20OR%20ECB",
  },
  {
    source_key: "x_crypto",
    name: "X / Twitter — Crypto market handles",
    channel_type: "SOCIAL",
    asset_classes: ["CRYPTO"],
    url: "https://twitter.com/search?q=BTC%20OR%20ETH%20ETF%20OR%20SEC",
  },
  {
    source_key: "kitco_gold",
    name: "Kitco Gold News",
    channel_type: "NEWS",
    asset_classes: ["COMMODITY", "FUTURES"],
    url: "https://www.kitco.com/news/",
  },
  {
    source_key: "cmegroup_alerts",
    name: "CME Group Market Alerts",
    channel_type: "EXCHANGE",
    asset_classes: ["FUTURES", "INDEX", "COMMODITY"],
    url: "https://www.cmegroup.com/market-data.html",
  },
  {
    source_key: "geopol_wire",
    name: "Geopolitical Wire (aggregated)",
    channel_type: "NEWS",
    asset_classes: ["FOREX", "COMMODITY", "INDEX"],
    url: "https://www.reuters.com/world/",
  },
];

export type ProductMove = {
  product: string;
  asset_class: AssetClass;
  direction: "UP" | "DOWN" | "VOLATILE";
};

export type ScrapedCandidate = {
  event_title: string;
  event_summary: string;
  geography: string;
  severity: "INFO" | "WARN" | "BREACH" | "CRITICAL";
  products: ProductMove[];
  asset_classes: AssetClass[];
  source_keys: string[];
  source_urls: Array<{ name: string; url: string }>;
  fingerprint_seed: string;
};

/** Realistic rotating event templates used when live scrape yields nothing / as enrichment. */
export const EVENT_TEMPLATES: ScrapedCandidate[] = [
  {
    event_title: "FOMC speakers signal higher-for-longer rates",
    event_summary: "Multiple Fed speakers lean hawkish; USD bid, risk assets soft into US session.",
    geography: "United States",
    severity: "BREACH",
    products: [
      { product: "EURUSD", asset_class: "FOREX", direction: "DOWN" },
      { product: "GBPUSD", asset_class: "FOREX", direction: "DOWN" },
      { product: "USDJPY", asset_class: "FOREX", direction: "UP" },
      { product: "NAS100", asset_class: "INDEX", direction: "DOWN" },
      { product: "XAUUSD", asset_class: "COMMODITY", direction: "DOWN" },
      { product: "US30", asset_class: "INDEX", direction: "DOWN" },
    ],
    asset_classes: ["FOREX", "INDEX", "COMMODITY"],
    source_keys: ["fed_press", "reuters_markets", "x_fxhedge"],
    source_urls: EVENT_ARTICLE_LINKS["fomc-hawkish"],
    fingerprint_seed: "fomc-hawkish",
  },
  {
    event_title: "ECB leaks suggest September cut odds rising",
    event_summary: "Wire reports cite ECB officials open to easing if inflation cools further.",
    geography: "Eurozone",
    severity: "WARN",
    products: [
      { product: "EURUSD", asset_class: "FOREX", direction: "DOWN" },
      { product: "GER40", asset_class: "INDEX", direction: "UP" },
      { product: "EU50", asset_class: "INDEX", direction: "UP" },
    ],
    asset_classes: ["FOREX", "INDEX"],
    source_keys: ["ecb_press", "bloomberg_fx"],
    source_urls: EVENT_ARTICLE_LINKS["ecb-cut-odds"],
    fingerprint_seed: "ecb-cut-odds",
  },
  {
    event_title: "OPEC+ unexpected output restraint rumours",
    event_summary: "Social + agency chatter of deeper OPEC+ cuts; energy complex jumps.",
    geography: "Global",
    severity: "BREACH",
    products: [
      { product: "USOIL", asset_class: "COMMODITY", direction: "UP" },
      { product: "UKOIL", asset_class: "COMMODITY", direction: "UP" },
      { product: "USOIL.f", asset_class: "FUTURES", direction: "UP" },
      { product: "CADJPY", asset_class: "FOREX", direction: "UP" },
    ],
    asset_classes: ["COMMODITY", "FUTURES", "FOREX"],
    source_keys: ["opec_press", "reuters_markets", "geopol_wire"],
    source_urls: EVENT_ARTICLE_LINKS["opec-cuts"],
    fingerprint_seed: "opec-cuts",
  },
  {
    event_title: "EIA crude inventory draw larger than expected",
    event_summary: "Weekly petroleum status shows larger-than-consensus stock draw.",
    geography: "United States",
    severity: "WARN",
    products: [
      { product: "USOIL", asset_class: "COMMODITY", direction: "UP" },
      { product: "UKOIL", asset_class: "COMMODITY", direction: "UP" },
    ],
    asset_classes: ["COMMODITY", "FUTURES"],
    source_keys: ["eia_petroleum", "cmegroup_alerts"],
    source_urls: EVENT_ARTICLE_LINKS["eia-draw"],
    fingerprint_seed: "eia-draw",
  },
  {
    event_title: "Spot gold breaks key level on geopolitics",
    event_summary: "Safe-haven bid into metals after escalation headlines; XAUUSD247 weekend risk elevated.",
    geography: "Global",
    severity: "BREACH",
    products: [
      { product: "XAUUSD", asset_class: "COMMODITY", direction: "UP" },
      { product: "XAUUSD247", asset_class: "COMMODITY", direction: "UP" },
      { product: "XAGUSD", asset_class: "COMMODITY", direction: "UP" },
      { product: "USDJPY", asset_class: "FOREX", direction: "DOWN" },
    ],
    asset_classes: ["COMMODITY", "FOREX"],
    source_keys: ["kitco_gold", "geopol_wire", "reuters_markets"],
    source_urls: EVENT_ARTICLE_LINKS["gold-geopol"],
    fingerprint_seed: "gold-geopol",
  },
  {
    event_title: "US CPI preview: sticky services inflation narrative",
    event_summary: "Street desks raise odds of hot CPI; vol bid in USD pairs and US indices.",
    geography: "United States",
    severity: "WARN",
    products: [
      { product: "EURUSD", asset_class: "FOREX", direction: "VOLATILE" },
      { product: "SPX500", asset_class: "INDEX", direction: "VOLATILE" },
      { product: "NAS100", asset_class: "INDEX", direction: "VOLATILE" },
      { product: "US10Y.f", asset_class: "FUTURES", direction: "DOWN" },
    ],
    asset_classes: ["FOREX", "INDEX", "FUTURES"],
    source_keys: ["bloomberg_fx", "x_fxhedge", "reuters_markets"],
    source_urls: EVENT_ARTICLE_LINKS["cpi-preview"],
    fingerprint_seed: "cpi-preview",
  },
  {
    event_title: "SEC crypto enforcement headline hits majors",
    event_summary: "Regulatory headline on major exchange; BTC/ETH risk-off, LP crypto books widen.",
    geography: "United States",
    severity: "BREACH",
    products: [
      { product: "BTCUSD", asset_class: "CRYPTO", direction: "DOWN" },
      { product: "ETHUSD", asset_class: "CRYPTO", direction: "DOWN" },
      { product: "SOLUSD", asset_class: "CRYPTO", direction: "DOWN" },
    ],
    asset_classes: ["CRYPTO"],
    source_keys: ["coindesk", "x_crypto", "binance_ann"],
    source_urls: EVENT_ARTICLE_LINKS["sec-crypto"],
    fingerprint_seed: "sec-crypto",
  },
  {
    event_title: "Exchange lists new perpetual / changes leverage",
    event_summary: "Major venue leverage policy change may shift crypto LP inventory and funding rates.",
    geography: "Global",
    severity: "WARN",
    products: [
      { product: "BTCUSD", asset_class: "CRYPTO", direction: "VOLATILE" },
      { product: "ETHUSD", asset_class: "CRYPTO", direction: "VOLATILE" },
    ],
    asset_classes: ["CRYPTO"],
    source_keys: ["binance_ann", "coinbase_blog"],
    source_urls: EVENT_ARTICLE_LINKS["exchange-leverage"],
    fingerprint_seed: "exchange-leverage",
  },
  {
    event_title: "BoE labour data surprise — GBP spike",
    event_summary: "UK labour print beats; GBP crosses jump, index futures reprice UK risk.",
    geography: "United Kingdom",
    severity: "WARN",
    products: [
      { product: "GBPUSD", asset_class: "FOREX", direction: "UP" },
      { product: "EURGBP", asset_class: "FOREX", direction: "DOWN" },
      { product: "UK100", asset_class: "INDEX", direction: "UP" },
    ],
    asset_classes: ["FOREX", "INDEX"],
    source_keys: ["boe_news", "reuters_markets"],
    source_urls: EVENT_ARTICLE_LINKS["boe-labour"],
    fingerprint_seed: "boe-labour",
  },
  {
    event_title: "PBOC CNY fixing stronger than expected",
    event_summary: "Fixing signals support for yuan; USDCNH soft, Asia risk tone improves.",
    geography: "China",
    severity: "WARN",
    products: [
      { product: "USDCNH", asset_class: "FOREX", direction: "DOWN" },
      { product: "AUDUSD", asset_class: "FOREX", direction: "UP" },
      { product: "HK50", asset_class: "INDEX", direction: "UP" },
      { product: "XAUUSD", asset_class: "COMMODITY", direction: "UP" },
    ],
    asset_classes: ["FOREX", "INDEX", "COMMODITY"],
    source_keys: ["pboc_en", "bloomberg_fx"],
    source_urls: EVENT_ARTICLE_LINKS["pboc-fix"],
    fingerprint_seed: "pboc-fix",
  },
  {
    event_title: "CME margin hike on equity index futures",
    event_summary: "Exchange margin change may force de-risking in futures-linked CFD books.",
    geography: "United States",
    severity: "WARN",
    products: [
      { product: "US30", asset_class: "INDEX", direction: "VOLATILE" },
      { product: "NAS100", asset_class: "INDEX", direction: "VOLATILE" },
      { product: "SPX500.f", asset_class: "FUTURES", direction: "VOLATILE" },
    ],
    asset_classes: ["INDEX", "FUTURES"],
    source_keys: ["cmegroup_alerts", "cftc_cot"],
    source_urls: EVENT_ARTICLE_LINKS["cme-margin"],
    fingerprint_seed: "cme-margin",
  },
  {
    event_title: "Middle East shipping disruption headline",
    event_summary: "Freight / energy risk premium rises; oil and gold bid, risk FX soft.",
    geography: "Middle East",
    severity: "CRITICAL",
    products: [
      { product: "USOIL", asset_class: "COMMODITY", direction: "UP" },
      { product: "XAUUSD", asset_class: "COMMODITY", direction: "UP" },
      { product: "XAUUSD247", asset_class: "COMMODITY", direction: "UP" },
      { product: "USDJPY", asset_class: "FOREX", direction: "DOWN" },
      { product: "SPX500", asset_class: "INDEX", direction: "DOWN" },
    ],
    asset_classes: ["COMMODITY", "FOREX", "INDEX"],
    source_keys: ["geopol_wire", "reuters_markets", "opec_press"],
    source_urls: EVENT_ARTICLE_LINKS["shipping-disruption"],
    fingerprint_seed: "shipping-disruption",
  },
];
