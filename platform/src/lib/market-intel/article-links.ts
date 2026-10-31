export type ArticleLink = { name: string; url: string };

/** Article-level pages for each rotating event — not channel homepages. */
export const EVENT_ARTICLE_LINKS: Record<string, ArticleLink[]> = {
  "fomc-hawkish": [
    {
      name: "Federal Reserve — Bowman remarks",
      url: "https://www.federalreserve.gov/newsevents/speech/bowman20231002a.htm",
    },
    {
      name: "Reuters — Fed policymakers higher for longer",
      url: "https://www.reuters.com/markets/rates-bonds/feds-bowman-expects-it-be-appropriate-raise-rates-further-2023-10-02/",
    },
  ],
  "ecb-cut-odds": [
    {
      name: "ECB monetary policy decision",
      url: "https://www.ecb.europa.eu/press/pr/date/2024/html/ecb.mp240912~4391ba6fc7.en.html",
    },
    {
      name: "Reuters — ECB cut-odds poll",
      url: "https://www.reuters.com/markets/europe/ecb-cut-rates-next-week-december-shallower-reductions-2025-2024-09-05/",
    },
  ],
  "opec-cuts": [
    {
      name: "Reuters — OPEC+ extends output cuts",
      url: "https://www.reuters.com/business/energy/opec-seen-prolonging-cuts-2024-into-2025-two-sources-say-2024-06-02/",
    },
    {
      name: "Reuters — OPEC+ delays output hike",
      url: "https://www.reuters.com/markets/commodities/opec-agrees-delay-october-oil-output-hike-two-months-2024-09-05/",
    },
  ],
  "eia-draw": [
    {
      name: "Reuters — EIA crude stocks larger-than-forecast draw",
      url: "https://www.reuters.com/business/energy/us-crude-gasoline-distillate-inventories-fall-eia-says-2024-09-25/",
    },
    {
      name: "EIA Weekly Petroleum Status Report",
      url: "https://www.eia.gov/petroleum/supply/weekly/pdf/highlights.pdf",
    },
  ],
  "gold-geopol": [
    {
      name: "Reuters — gold and Middle East risk",
      url: "https://www.reuters.com/business/gold-softens-prospects-fed-rate-hikes-brent-tops-100-2026-07-24/",
    },
    {
      name: "Reuters — Red Sea shipping disruption",
      url: "https://www.reuters.com/world/middle-east/red-sea-shipping-slows-after-houthi-attack-saudi-arabia-data-shows-2026-07-27/",
    },
  ],
  "cpi-preview": [
    {
      name: "BLS Consumer Price Index news release",
      url: "https://www.bls.gov/news.release/cpi.nr0.htm",
    },
    {
      name: "Reuters — US CPI preview",
      url: "https://www.reuters.com/markets/us/us-consumer-inflation-probably-cooled-february-2024-03-12/",
    },
  ],
  "sec-crypto": [
    {
      name: "CoinDesk — SEC sues Binance",
      url: "https://www.coindesk.com/policy/2023/06/05/sec-sues-crypto-exchange-binance-ceo-changpeng-zhao",
    },
    {
      name: "CoinDesk — SEC sues Coinbase",
      url: "https://www.coindesk.com/policy/2023/06/06/sec-sues-coinbase-on-unregistered-securities-exchange-allegations",
    },
  ],
  "exchange-leverage": [
    {
      name: "Binance — USD-M perpetual leverage update",
      url: "https://www.binance.com/en/square/post/310525172431937",
    },
    {
      name: "Coinbase Blog — SEC case",
      url: "https://www.coinbase.com/blog/coinbase-and-the-sec",
    },
  ],
  "boe-labour": [
    {
      name: "ONS UK labour market bulletin",
      url: "https://www.ons.gov.uk/employmentandlabourmarket/peopleinwork/employmentandemployeetypes/bulletins/uklabourmarket/december2024",
    },
    {
      name: "Reuters — UK pay growth lifts sterling",
      url: "https://www.reuters.com/markets/currencies/sterling-gets-lift-hotter-uk-wage-growth-2024-12-17/",
    },
  ],
  "pboc-fix": [
    {
      name: "Reuters — PBOC stronger-than-expected yuan fixing",
      url: "https://www.reuters.com/markets/currencies/china-sets-yuan-much-stronger-fixing-than-markets-expected-2024-03-28/",
    },
    {
      name: "Reuters — firmer yuan fixings explained",
      url: "https://www.reuters.com/markets/currencies/whats-behind-firmer-than-expected-yuan-fixings-2023-07-05/",
    },
  ],
  "cme-margin": [
    {
      name: "CME Clearing — equity SPAN 2 margin parameters",
      url: "https://www.cmegroup.com/notices/clearing/2026/02/26-054.html",
    },
    {
      name: "CME Clearing — metal and equity performance bond",
      url: "https://www.cmegroup.com/notices/clearing/2025/10/25-329.html",
    },
  ],
  "shipping-disruption": [
    {
      name: "Reuters — Red Sea shipping slows after attack",
      url: "https://www.reuters.com/world/middle-east/red-sea-shipping-slows-after-houthi-attack-saudi-arabia-data-shows-2026-07-27/",
    },
    {
      name: "Reuters — Houthi blockade and oil prices",
      url: "https://www.reuters.com/business/energy/houthi-red-sea-blockade-would-lift-oil-prices-workarounds-could-limit-impact-2026-07-20/",
    },
  ],
};

const LANDING_PATHS = [
  "reuters.com/markets",
  "reuters.com/world",
  "reuters.com",
  "bloomberg.com/markets/currencies",
  "bloomberg.com",
  "federalreserve.gov/newsevents.htm",
  "federalreserve.gov/newsevents.html",
  "ecb.europa.eu/press/pr/html/index.en.html",
  "kitco.com/news",
  "coindesk.com",
  "binance.com/en/support/announcement",
  "coinbase.com/blog",
  "cmegroup.com/market-data.html",
  "eia.gov/petroleum",
  "bankofengland.co.uk/news",
  "pbc.gov.cn/en",
  "opec.org/opec_web/en/press_room/274.htm",
  "cftc.gov/marketreports/commitmentsoftraders/index.htm",
];

export function isGenericSourceLanding(url: string): boolean {
  try {
    const u = new URL(url);
    const hostPath = `${u.hostname.replace(/^www\./, "")}${u.pathname}`.replace(/\/+$/, "").toLowerCase();
    if (u.hostname.includes("twitter.com") || u.hostname.includes("x.com")) {
      return u.pathname.startsWith("/search");
    }
    return LANDING_PATHS.some((p) => hostPath === p);
  } catch {
    return false;
  }
}

export function articleLinksForTitle(eventTitle: string, fingerprintSeed?: string): ArticleLink[] | null {
  if (fingerprintSeed && EVENT_ARTICLE_LINKS[fingerprintSeed]) return EVENT_ARTICLE_LINKS[fingerprintSeed];
  const byTitle: Record<string, string> = {
    "FOMC speakers signal higher-for-longer rates": "fomc-hawkish",
    "ECB leaks suggest September cut odds rising": "ecb-cut-odds",
    "OPEC+ unexpected output restraint rumours": "opec-cuts",
    "EIA crude inventory draw larger than expected": "eia-draw",
    "Spot gold breaks key level on geopolitics": "gold-geopol",
    "US CPI preview: sticky services inflation narrative": "cpi-preview",
    "SEC crypto enforcement headline hits majors": "sec-crypto",
    "Exchange lists new perpetual / changes leverage": "exchange-leverage",
    "BoE labour data surprise — GBP spike": "boe-labour",
    "PBOC CNY fixing stronger than expected": "pboc-fix",
    "CME margin hike on equity index futures": "cme-margin",
    "Middle East shipping disruption headline": "shipping-disruption",
  };
  const key = byTitle[eventTitle];
  return key ? EVENT_ARTICLE_LINKS[key] ?? null : null;
}

export function resolveFindingSources(
  eventTitle: string,
  sourcesJson: string,
  fingerprintSeed?: string
): ArticleLink[] {
  const articles = articleLinksForTitle(eventTitle, fingerprintSeed);
  let stored: ArticleLink[] = [];
  try {
    const v = JSON.parse(sourcesJson || "[]");
    if (Array.isArray(v)) {
      stored = v.filter((s) => s && s.url).map((s) => ({ name: String(s.name || s.url), url: String(s.url) }));
    }
  } catch {
    stored = [];
  }
  const specificStored = stored.filter((s) => !isGenericSourceLanding(s.url));
  if (articles?.length) {
    const extra = specificStored.filter((s) => !articles.some((a) => a.url === s.url));
    return [...articles, ...extra];
  }
  return specificStored.length ? specificStored : stored;
}
