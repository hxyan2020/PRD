import type Database from "better-sqlite3";

type DetectorDef = {
  code: string;
  name: string;
  description: string;
  product: "CFD" | "CRYPTO" | "CFD+CRYPTO";
  domain_code: string;
  monitor_id: string;
  warn_threshold: number;
  breach_threshold: number;
  comparator: "gte" | "lte";
};

const DETECTORS: DetectorDef[] = [
  {
    code: "DET-MARGIN-UTIL",
    name: "Accounts >90% margin utilisation",
    description: "Counts accounts near stop-out; spikes often during US open / macro.",
    product: "CFD",
    domain_code: "CREDIT_CLIENT",
    monitor_id: "M2-MRG-014",
    warn_threshold: 50,
    breach_threshold: 100,
    comparator: "gte",
  },
  {
    code: "DET-COPY-CONC",
    name: "Copy provider concentration",
    description: "Top signal provider share of copy equity.",
    product: "CFD",
    domain_code: "CREDIT_CLIENT",
    monitor_id: "M2-COPY-009",
    warn_threshold: 15,
    breach_threshold: 25,
    comparator: "gte",
  },
  {
    code: "DET-EQUITY-DD",
    name: "Company equity drawdown",
    description: "CFD book drawdown detector.",
    product: "CFD",
    domain_code: "MARKET_PRICING",
    monitor_id: "M2-EQ-001",
    warn_threshold: 3,
    breach_threshold: 5,
    comparator: "gte",
  },
  {
    code: "DET-HEDGE-COV",
    name: "Hedge coverage ratio",
    description: "A-book hedge coverage vs target (lower is worse).",
    product: "CFD",
    domain_code: "LP_HEDGE",
    monitor_id: "M2-HEDGE-007",
    warn_threshold: 85,
    breach_threshold: 70,
    comparator: "lte",
  },
  {
    code: "DET-LP-REJECT",
    name: "LP reject rate",
    description: "oneZero / LP reject rate storm detector.",
    product: "CFD",
    domain_code: "LP_HEDGE",
    monitor_id: "M2-LP-022",
    warn_threshold: 2,
    breach_threshold: 5,
    comparator: "gte",
  },
  {
    code: "DET-XAU247",
    name: "XAUUSD247 net exposure",
    description: "24/7 gold net lots vs product limits.",
    product: "CFD",
    domain_code: "PRODUCT_CONFIG",
    monitor_id: "M2-XAU-247",
    warn_threshold: 10000,
    breach_threshold: 15000,
    comparator: "gte",
  },
  {
    code: "DET-HOT-WALLET",
    name: "Crypto hot wallet float",
    description: "Hot wallet float ratio vs custody policy.",
    product: "CRYPTO",
    domain_code: "CRYPTO_EXCHANGE",
    monitor_id: "M2-CRYPTO-WALLET",
    warn_threshold: 15,
    breach_threshold: 25,
    comparator: "gte",
  },
  {
    code: "DET-CRYPTO-LIQ",
    name: "Crypto liquidation backlog",
    description: "Liquidation engine order backlog.",
    product: "CRYPTO",
    domain_code: "CRYPTO_EXCHANGE",
    monitor_id: "M2-CRYPTO-LIQ",
    warn_threshold: 50,
    breach_threshold: 200,
    comparator: "gte",
  },
  {
    code: "DET-FRAUD-CLUSTER",
    name: "Multi-account cluster score",
    description: "Promo / mule ring clustering score.",
    product: "CFD+CRYPTO",
    domain_code: "FRAUD_CONDUCT",
    monitor_id: "M2-FRAUD-011",
    warn_threshold: 0.7,
    breach_threshold: 0.85,
    comparator: "gte",
  },
  {
    code: "DET-STALE-FEED",
    name: "Stale quote symbols",
    description: "Count of symbols with stale LP/client quotes.",
    product: "CFD",
    domain_code: "MARKET_PRICING",
    monitor_id: "M2-FEED-003",
    warn_threshold: 3,
    breach_threshold: 10,
    comparator: "gte",
  },
  {
    code: "DET-MKT-INTEL",
    name: "Market intelligence high-impact hits",
    description: "Count of WARN+ market-intel findings in the latest 5-minute scan (news/social/official affecting LP prices).",
    product: "CFD+CRYPTO",
    domain_code: "MARKET_PRICING",
    monitor_id: "M2-MKT-INTEL",
    warn_threshold: 1,
    breach_threshold: 3,
    comparator: "gte",
  },
  {
    code: "DET-PERP-BASIS",
    name: "Perp mark–index basis",
    description: "Absolute basis between perp mark and index in basis points.",
    product: "CRYPTO",
    domain_code: "CRYPTO_EXCHANGE",
    monitor_id: "M2-PERP-BASIS",
    warn_threshold: 25,
    breach_threshold: 60,
    comparator: "gte",
  },
  {
    code: "DET-FUNDING-RATE",
    name: "Perp funding rate absolute",
    description: "Absolute 8h funding rate on major perpetual contracts.",
    product: "CRYPTO",
    domain_code: "CRYPTO_EXCHANGE",
    monitor_id: "M2-FUNDING-RATE",
    warn_threshold: 0.15,
    breach_threshold: 0.5,
    comparator: "gte",
  },
  {
    code: "DET-STABLE-EXP",
    name: "Stablecoin depeg exposure",
    description: "Mark-to-market USD gap on house stablecoin inventory.",
    product: "CRYPTO",
    domain_code: "CRYPTO_EXCHANGE",
    monitor_id: "M2-STABLE-EXP",
    warn_threshold: 500000,
    breach_threshold: 2000000,
    comparator: "gte",
  },
  {
    code: "DET-MT-DISC",
    name: "Trading platform disconnect rate",
    description: "Share of sessions disconnected on MT4/MT5/App gateways.",
    product: "CFD+CRYPTO",
    domain_code: "TECH_INFRA",
    monitor_id: "M2-MT-DISC",
    warn_threshold: 1,
    breach_threshold: 5,
    comparator: "gte",
  },
  {
    code: "DET-RECON-BRK",
    name: "Reconciliation breaks open",
    description: "Open ledger vs bank/chain recon exceptions.",
    product: "CFD+CRYPTO",
    domain_code: "OPS_PROCESS",
    monitor_id: "M2-RECON-BRK",
    warn_threshold: 5,
    breach_threshold: 20,
    comparator: "gte",
  },
  {
    code: "DET-KILL-COUNT",
    name: "Active symbol kill-switches",
    description: "Count of symbols currently halted by kill-switch.",
    product: "CFD+CRYPTO",
    domain_code: "TECH_INFRA",
    monitor_id: "M2-KILL-COUNT",
    warn_threshold: 2,
    breach_threshold: 5,
    comparator: "gte",
  },
  {
    code: "DET-NEWS-GROSS",
    name: "Gross notional into Tier-1 news",
    description: "Client+house gross USD notional into the next Tier-1 macro window.",
    product: "CFD",
    domain_code: "MARKET_PRICING",
    monitor_id: "M2-NEWS-GROSS",
    warn_threshold: 50000000,
    breach_threshold: 120000000,
    comparator: "gte",
  },
  {
    code: "DET-CHARGEBACK",
    name: "Payment chargebacks 24h",
    description: "Card/APM chargeback count in rolling 24 hours.",
    product: "CFD",
    domain_code: "FRAUD_CONDUCT",
    monitor_id: "M2-CHARGEBACK",
    warn_threshold: 15,
    breach_threshold: 40,
    comparator: "gte",
  },
  {
    code: "DET-IB-PAYOUT",
    name: "IB rebate anomaly score",
    description: "Anomaly score on introducing-broker rebate patterns.",
    product: "CFD",
    domain_code: "FRAUD_CONDUCT",
    monitor_id: "M2-IB-PAYOUT",
    warn_threshold: 0.6,
    breach_threshold: 0.8,
    comparator: "gte",
  },
  {
    code: "DET-COPY-CHURN",
    name: "Copy follower net exit 1h",
    description: "Net percentage of copy followers exiting a top provider in 1 hour.",
    product: "CFD",
    domain_code: "CREDIT_CLIENT",
    monitor_id: "M2-COPY-CHURN",
    warn_threshold: 12,
    breach_threshold: 25,
    comparator: "gte",
  },
];

export function seedDetectors(db: Database.Database) {
  // Preserve warn/breach on conflict — synced from Monitor 2.0 threshold edits.
  const upsert = db.prepare(
    `INSERT INTO detectors
      (code, name, description, product, domain_code, monitor_id, warn_threshold, breach_threshold, comparator, enabled)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
     ON CONFLICT(code) DO UPDATE SET
       name = excluded.name,
       description = excluded.description,
       product = excluded.product,
       domain_code = excluded.domain_code,
       monitor_id = excluded.monitor_id,
       comparator = excluded.comparator`
  );
  for (const d of DETECTORS) {
    upsert.run(
      d.code,
      d.name,
      d.description,
      d.product,
      d.domain_code,
      d.monitor_id,
      d.warn_threshold,
      d.breach_threshold,
      d.comparator
    );
  }
}

export function evaluateDetector(
  comparator: string,
  value: number,
  warn: number,
  breach: number
): "HEALTHY" | "WARN" | "BREACH" {
  if (comparator === "lte") {
    if (value <= breach) return "BREACH";
    if (value <= warn) return "WARN";
    return "HEALTHY";
  }
  if (value >= breach) return "BREACH";
  if (value >= warn) return "WARN";
  return "HEALTHY";
}

/** Prototype: jitter indicator last_value slightly to simulate live ticks. */
export function sampleDetectorValue(base: number | null, monitorId: string): number {
  const b = base ?? 0;
  // Market intel is owned by the 5-minute scanner — do not jitter over its hits.
  if (monitorId === "M2-MKT-INTEL") return b;
  const jitter =
    monitorId.includes("HEDGE") ? (Math.random() - 0.55) * 4 : (Math.random() - 0.35) * Math.max(1, b * 0.08);
  return Math.round((b + jitter) * 100) / 100;
}
