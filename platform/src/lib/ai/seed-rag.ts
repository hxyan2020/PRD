import type Database from "better-sqlite3";

type RagDoc = {
  doc_key: string;
  title: string;
  category: string;
  product_scope: string;
  content: string;
  source_ref: string;
  tags: string[];
};

const RAG_DOCS: RagDoc[] = [
  {
    doc_key: "biz-overview",
    title: "Vantage Markets — Business Overview",
    category: "BUSINESS",
    product_scope: "CFD+CRYPTO",
    source_ref: "https://www.vantagemarkets.com/en/",
    tags: ["company", "cfd", "broker"],
    content: `Vantage Markets is an international online CFD and forex broker founded around 2009. It offers 1,000+ CFD instruments across forex, indices, commodities, share CFDs, ETFs, bonds and crypto CFDs (region-dependent). The brand also operates / is building crypto exchange capabilities (matching, wallets, liquidations) that must be covered by CRMP. Positioning: award-winning broker, multi-platform (MT4, MT5, TradingView, Vantage App, Web Trading), copy trading, and Scuderia Ferrari HP partnership. US persons are geo-blocked on the international site.`,
  },
  {
    doc_key: "accounts-pricing",
    title: "Account Types & Pricing Model",
    category: "PRODUCT",
    product_scope: "CFD",
    source_ref: "https://www.vantagemarkets.com/en/trading/accounts/",
    tags: ["accounts", "raw-ecn", "stp", "pro-ecn", "cent", "swap-free"],
    content: `Account types: Standard STP (spreads from ~1.0–1.1 pips, no commission, min deposit ~$50), Raw ECN (spreads from 0.0 + ~$3/lot/side), Pro ECN (spreads from 0.0 + ~$1.50/lot/side, typically $10k funding prerequisite), Cent accounts (balance in cents), Swap Free (Islamic). Demo accounts with virtual funds available. Leverage is entity-dependent: often up to 1:500 offshore (VFSC/CIMA), 1:30 retail under FCA/ASIC.`,
  },
  {
    doc_key: "xauusd247",
    title: "XAUUSD247 Product Controls",
    category: "PRODUCT",
    product_scope: "CFD",
    source_ref: "https://www.vantagemarkets.com/en/commodities-trading/gold-trading/xauusd24-7/",
    tags: ["gold", "xauusd247", "exposure-limits", "weekend"],
    content: `XAUUSD247 is Vantage's 24/7 gold CFD including weekends. Contract size 1 oz (vs 100 oz traditional XAUUSD). No separate commission; costs via spread + swap. Tiered leverage by position size (up to ~1:500 on small size). Exposure limits: 15,000 lots net / 30,000 lots gross per login; when hit, account enters close-only mode. Available on MT5, Vantage App and Web. Weekend cashback promotions may increase weekend activity and risk.`,
  },
  {
    doc_key: "copy-trading",
    title: "Copy Trading Cascade Risk",
    category: "RISK_POLICY",
    product_scope: "CFD",
    source_ref: "https://www.vantagemarkets.com/en/trading-platform/copy-trading/",
    tags: ["copy-trading", "concentration", "signal-provider"],
    content: `Copy trading lets Copiers automatically replicate Signal Provider portfolios. Min copy amount from ~USD50. Providers need min deposit ~USD500 and experience checks. Concentration risk: if one provider attracts a large share of copy equity, a losing streak or style break cascades to many copiers and can spike margin utilisation / stop-outs. Known control: impose per-provider copier equity caps, pause new copies, require dual-control before lifting caps. CRMP indicator M2-COPY-009 tracks top provider concentration.`,
  },
  {
    doc_key: "margin-stopout",
    title: "Margin Call & Stop-Out Playbook",
    category: "RISK_POLICY",
    product_scope: "CFD",
    source_ref: "internal://risk-policies/margin",
    tags: ["margin", "stop-out", "credit"],
    content: `Raw/Pro ECN typical margin call 50% / stop-out 20%; Standard STP stop-out often 50%. Spike in accounts >90% utilisation during US open often coincides with high-impact macro (NFP, FOMC, CPI) or gold/index volatility. Known paths: (1) verify feed not stale, (2) check cluster of copy followers, (3) confirm no LP reject storm forcing B-book gap, (4) if organic event risk — monitor only + Lark notify; if toxic cluster — tighten group leverage / disable new exposure.`,
  },
  {
    doc_key: "lp-hedge",
    title: "LP Reject & Hedge Coverage",
    category: "RISK_POLICY",
    product_scope: "CFD",
    source_ref: "internal://lp/onezero",
    tags: ["lp", "hedge", "onezero", "bridge"],
    content: `Client flow is aggregated via bridges (e.g. oneZero) to prime-of-prime LPs. Rising LP reject rate or hedge coverage below target (warn <85%) indicates inventory / connectivity / LP health issues. Actions: check Equinix/server latency, disable unhealthy LP endpoint, widen spreads or halt symbols, page Trading Infra. Do not auto-disable LP without System confirmation unless reject rate CRITICAL.`,
  },
  {
    doc_key: "crypto-wallet",
    title: "Crypto Hot Wallet Float Policy",
    category: "RISK_POLICY",
    product_scope: "CRYPTO",
    source_ref: "internal://crypto-exchange/wallets",
    tags: ["crypto", "wallet", "custody", "float"],
    content: `Hot wallet float ratio = hot balances / total custody. Warn ~15%, breach ~25%. Elevated float increases theft/hack loss severity. Known remediation: initiate cold sweep to reduce hot float below warn, pause large withdrawals temporarily, notify Crypto Exchange Risk + System via Lark. Always require human confirmation before pausing withdrawals.`,
  },
  {
    doc_key: "entities-leverage",
    title: "Multi-Entity Regulation & Leverage Caps",
    category: "REGULATORY",
    product_scope: "CFD+CRYPTO",
    source_ref: "https://www.vantagemarkets.com/en/regulations/",
    tags: ["asic", "fca", "vfsc", "cima", "fsca", "leverage"],
    content: `Vantage operates via multiple entities (ASIC, FCA UK site, FSCA, CIMA, VFSC/international). International site users are not under FCA FOS/FSCS. Retail leverage caps differ by entity. Any AI suggestion to raise leverage must check client entity and classification (retail vs professional). Product availability (e.g. crypto CFDs, XAUUSD247) is jurisdiction-dependent.`,
  },
  {
    doc_key: "platforms",
    title: "Platform Stack & Failure Modes",
    category: "TECH",
    product_scope: "CFD+CRYPTO",
    source_ref: "https://www.vantagemarkets.com/en/trading-platform/",
    tags: ["mt4", "mt5", "tradingview", "app", "web"],
    content: `Platforms: MT4, MT5, TradingView (live execution), Vantage App, Vantage Web Trading, Forex VPS for EAs. Stale quotes / feed gaps often surface first on Manager API vs LP feed divergence. Copy mode and manual mode share app events. Infra incidents should page Trading Infra P1 Lark channel.`,
  },
  {
    doc_key: "promos-abuse",
    title: "Promotions & Abuse Patterns",
    category: "FRAUD",
    product_scope: "CFD",
    source_ref: "https://www.vantagemarkets.com/en/promotions/",
    tags: ["deposit-bonus", "v-points", "referral", "abuse"],
    content: `Promos include deposit bonus, refer-a-friend, Vantage Rewards (V-Points), Gold 24/7 cashback. Abuse patterns: multi-account bonus farming, referral rings, cent-account scaling. Multi-account cluster score (M2-FRAUD-011) WARN at 0.7 / BREACH 0.85. Path: freeze payout of bonus, link CRM KYC cluster, Ops investigation — do not auto-ban without Ops Lead.`,
  },
  {
    doc_key: "macro-event-risk",
    title: "Macro Event Windows & Price Jumps",
    category: "MARKET",
    product_scope: "CFD+CRYPTO",
    source_ref: "https://www.vantagemarkets.com/en/economic-calendar/",
    tags: ["macro", "nfp", "fomc", "cpi", "gap"],
    content: `High-impact events (NFP, FOMC, CPI, central bank rates) cause spread blowouts, gaps, and margin spikes — especially on gold, USD pairs, US indices. Before attributing drawdown or margin breaches to toxic flow, check economic calendar within ±60 minutes. If event coincides, prefer monitoring + communication over punitive client actions.`,
  },
  {
    doc_key: "escalation-spine",
    title: "CRMP Escalation Spine",
    category: "OPS",
    product_scope: "PLATFORM",
    source_ref: "internal://crmp/escalation",
    tags: ["monitor2", "lark", "sla", "ai"],
    content: `Spine: Monitor 2.0 alarm → CRMP ticket → AI analysis (skill match OR RAG+external) → Lark notify → human gate for high impact → audit + daily dashboard. Messenger is Lark. Indicator upstream is Monitor 2.0. Departments: Risk Control, Operations, AI, System.`,
  },
];

const MACRO_EVENTS = [
  {
    event_code: "USD-CPI-2026-09",
    title: "US CPI release — hotter than expected",
    event_time: "2026-09-30T12:30:00Z",
    impact: "HIGH",
    currencies: ["USD"],
    instruments: ["XAUUSD", "XAUUSD247", "NAS100", "SP500", "EURUSD"],
    description:
      "US CPI printed above consensus, USD strengthened then reversed; gold and US indices saw elevated volatility into the US session open. Historically correlates with margin utilisation spikes on gold/index CFDs.",
    source_url: "https://www.investing.com/economic-calendar/",
  },
  {
    event_code: "FOMC-2026-09",
    title: "FOMC rate decision & press conference",
    event_time: "2026-09-17T18:00:00Z",
    impact: "HIGH",
    currencies: ["USD"],
    instruments: ["XAUUSD", "USDJPY", "NAS100"],
    description:
      "FOMC hold with hawkish guidance. Spreads widened on USD majors and gold for ~15 minutes post-release.",
    source_url: "https://www.federalreserve.gov/",
  },
  {
    event_code: "BTC-ETF-FLOW-2026-10",
    title: "Spot BTC ETF outflow day",
    event_time: "2026-10-01T14:00:00Z",
    impact: "MEDIUM",
    currencies: ["USD"],
    instruments: ["BTCUSD", "ETHUSD"],
    description:
      "Reported spot BTC ETF net outflows pressured crypto prices; watch liquidation backlog and hot wallet float if withdrawal queues build.",
    source_url: "https://www.coingecko.com/",
  },
];

export function seedRagIfEmpty(db: Database.Database) {
  const count = db.prepare(`SELECT COUNT(*) AS c FROM rag_documents`).get() as { c: number };
  if (count.c > 0) return;

  const insert = db.prepare(
    `INSERT INTO rag_documents (doc_key, title, category, product_scope, content, source_ref, tags_json)
     VALUES (@doc_key, @title, @category, @product_scope, @content, @source_ref, @tags_json)`
  );
  const fts = db.prepare(`INSERT INTO rag_fts (rowid, title, content, tags) VALUES (?, ?, ?, ?)`);

  const tx = db.transaction(() => {
    for (const d of RAG_DOCS) {
      const info = insert.run({
        doc_key: d.doc_key,
        title: d.title,
        category: d.category,
        product_scope: d.product_scope,
        content: d.content,
        source_ref: d.source_ref,
        tags_json: JSON.stringify(d.tags),
      });
      fts.run(Number(info.lastInsertRowid), d.title, d.content, d.tags.join(" "));
    }
  });
  tx();

  const insertEvent = db.prepare(
    `INSERT INTO external_macro_events
      (event_code, title, event_time, impact, currencies_json, instruments_json, description, source_url)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  );
  for (const e of MACRO_EVENTS) {
    insertEvent.run(
      e.event_code,
      e.title,
      e.event_time,
      e.impact,
      JSON.stringify(e.currencies),
      JSON.stringify(e.instruments),
      e.description,
      e.source_url
    );
  }
}

export function reindexRagFts(db: Database.Database) {
  db.exec(`DELETE FROM rag_fts`);
  const rows = db
    .prepare(`SELECT id, title, content, tags_json FROM rag_documents WHERE status = 'ACTIVE'`)
    .all() as Array<{ id: number; title: string; content: string; tags_json: string }>;
  const fts = db.prepare(`INSERT INTO rag_fts (rowid, title, content, tags) VALUES (?, ?, ?, ?)`);
  for (const r of rows) {
    const tags = (JSON.parse(r.tags_json) as string[]).join(" ");
    fts.run(r.id, r.title, r.content, tags);
  }
}
