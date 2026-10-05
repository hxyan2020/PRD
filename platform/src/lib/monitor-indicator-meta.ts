import { LINKED_SCENARIOS, SKILL_SCENARIOS } from "@/lib/ai/risk-scenarios-catalog";

export type IndicatorCombo = {
  code: string;
  name: string;
  mode: "sequence" | "together";
  partners: string[];
  summary: string;
};

export type IndicatorMeta = {
  monitor_id: string;
  description: string;
  risk_scenarios: string[];
  combinations: IndicatorCombo[];
  frequency: string;
  frequency_zh: string;
};

/** Check cadence by monitor family — used when a skill does not declare one. */
const FREQUENCY_BY_ID: Record<string, { en: string; zh: string }> = {
  "M2-MKT-INTEL": { en: "Every 5 min", zh: "每 5 分鐘" },
  "M2-STOP-018": { en: "Every 1 min (5m window)", zh: "每 1 分鐘（5 分鐘窗）" },
  "M2-BRIDGE-LAT": { en: "Every 30 sec", zh: "每 30 秒" },
  "M2-API-023": { en: "Every 1 min (5m window)", zh: "每 1 分鐘（5 分鐘窗）" },
  "M2-FUND-010": { en: "Every 5 min", zh: "每 5 分鐘" },
  "M2-WD-015": { en: "Every 5 min", zh: "每 5 分鐘" },
  "M2-CRYPTO-DEP": { en: "Every 5 min", zh: "每 5 分鐘" },
  "M2-MODEL-006": { en: "Hourly (7d rolling)", zh: "每小時（7 日滾動）" },
  "M2-CAP-024": { en: "Daily + on breach event", zh: "每日＋違規事件時" },
  "M2-SEG-025": { en: "Daily EOD + intraday flash", zh: "每日日終＋盤中快閃" },
  "M2-VAR-002": { en: "Every 15 min", zh: "每 15 分鐘" },
  "M2-CORR-004": { en: "Every 30 min", zh: "每 30 分鐘" },
  "M2-CRYPTO-ORACLE": { en: "Every 10 sec", zh: "每 10 秒" },
  "M2-CRYPTO-LIQ": { en: "Every 30 sec", zh: "每 30 秒" },
  "M2-CRYPTO-WALLET": { en: "Every 1 min", zh: "每 1 分鐘" },
  "M2-PERP-BASIS": { en: "Every 10 sec", zh: "每 10 秒" },
  "M2-FUNDING-RATE": { en: "Every 1 min", zh: "每 1 分鐘" },
  "M2-STABLE-EXP": { en: "Every 5 min", zh: "每 5 分鐘" },
  "M2-MT-DISC": { en: "Every 30 sec", zh: "每 30 秒" },
  "M2-RECON-BRK": { en: "Every 15 min", zh: "每 15 分鐘" },
  "M2-KILL-COUNT": { en: "Every 30 sec", zh: "每 30 秒" },
  "M2-NEWS-GROSS": { en: "Every 5 min pre-event", zh: "事件前每 5 分鐘" },
  "M2-CHARGEBACK": { en: "Hourly (24h window)", zh: "每小時（24 小時窗）" },
  "M2-IB-PAYOUT": { en: "Hourly", zh: "每小時" },
  "M2-COPY-CHURN": { en: "Every 1 min", zh: "每 1 分鐘" },
};

const DEFAULT_FREQ = { en: "Every 1 min", zh: "每 1 分鐘" };

const FALLBACK_DESCRIPTION: Record<string, string> = {
  "M2-EQ-001": "Tracks company CFD book equity drawdown versus the session high-water mark.",
  "M2-MRG-014": "Counts live accounts sitting above 90% margin utilisation.",
  "M2-LP-022": "Measures oneZero LP reject rate as a share of attempted hedges.",
  "M2-HEDGE-007": "Measures how much of the CFD book is covered by LP hedges.",
  "M2-XAU-247": "Tracks net XAUUSD247 lot exposure against product limits.",
  "M2-CRYPTO-WALLET": "Hot-wallet float as a share of total crypto custody.",
  "M2-CRYPTO-LIQ": "Orders waiting in the crypto liquidation engine backlog.",
  "M2-COPY-009": "Share of copy equity concentrated on the top signal provider.",
  "M2-FEED-003": "Count of symbols with stale or crossed quotes.",
  "M2-FRAUD-011": "Multi-account / device cluster abuse score.",
  "M2-STOP-018": "Stop-out events in a rolling 5-minute window.",
  "M2-NBP-016": "Accounts that hit negative balance protection concurrently.",
  "M2-SLIP-021": "Average client slippage on major CFD symbols over 15 minutes.",
  "M2-BRIDGE-LAT": "p95 bridge fill latency for LP hedges.",
  "M2-ABOOK-008": "Share of session volume routed A-book to LPs.",
  "M2-VAR-002": "Utilisation of the 1-day VaR risk budget.",
  "M2-CORR-004": "Drift of the book correlation matrix versus baseline.",
  "M2-GAP-012": "Estimated USD exposure to weekend / news gaps.",
  "M2-SPREAD-005": "Live spreads versus the session median multiple.",
  "M2-LEV-019": "New accounts opened at max leverage in the last 24 hours.",
  "M2-BONUS-013": "Bonus converted to withdrawable cash in 24 hours (USD).",
  "M2-WD-015": "Client withdrawal volume in the last hour (USD).",
  "M2-FUND-010": "Funding / deposit exception count in the last hour.",
  "M2-PAY-017": "Payment-fraud model score on inbound funding.",
  "M2-WASH-020": "Wash-trading / collusion detection score.",
  "M2-API-023": "Trading API error rate over a 5-minute window.",
  "M2-MODEL-006": "Detector precision on a 7-day rolling window.",
  "M2-CAP-024": "Regulatory capital buffer ratio by entity.",
  "M2-SEG-025": "Client-money segregation gap versus required float (USD).",
  "M2-CRYPTO-ORACLE": "Lag between mark-price oracle and matching engine.",
  "M2-CRYPTO-INS": "Daily drawdown of the crypto insurance fund.",
  "M2-CRYPTO-OI": "Largest account open-interest share per contract.",
  "M2-CRYPTO-DEP": "Crypto deposit volume in the last hour (USD).",
  "M2-ARB-026": "Latency-arbitrage toxicity score on CFD flow.",
  "M2-SWAP-027": "Symbols whose swap diverges from the benchmark.",
  "M2-MKT-INTEL": "High-impact market-intelligence hits in the last 5 minutes.",
  "M2-PERP-BASIS": "Absolute basis between perpetual mark price and the index, in basis points.",
  "M2-FUNDING-RATE": "Absolute 8-hour perpetual funding rate on major contracts.",
  "M2-STABLE-EXP": "Mark-to-market USD exposure if house stablecoin inventory depegs.",
  "M2-MT-DISC": "Share of MT4/MT5/App sessions currently disconnected from trade gateways.",
  "M2-RECON-BRK": "Open reconciliation breaks between internal ledger and bank/chain.",
  "M2-KILL-COUNT": "Count of symbols currently halted by kill-switch.",
  "M2-NEWS-GROSS": "Gross client and house notional sitting into the next Tier-1 macro print.",
  "M2-CHARGEBACK": "Payment chargebacks and disputes in the last 24 hours.",
  "M2-IB-PAYOUT": "Anomaly score on introducing-broker rebate payout patterns.",
  "M2-COPY-CHURN": "Net percentage of copy followers exiting a top provider in one hour.",
};

function frequencyFor(monitorId: string, unit: string | null | undefined) {
  if (FREQUENCY_BY_ID[monitorId]) return FREQUENCY_BY_ID[monitorId];
  const u = (unit || "").toLowerCase();
  if (u.includes("/5m") || u.includes("5m")) return { en: "Every 1 min (5m window)", zh: "每 1 分鐘（5 分鐘窗）" };
  if (u.includes("/h") || u.includes("1h")) return { en: "Every 5 min", zh: "每 5 分鐘" };
  if (u.includes("24h") || u.includes("7d")) return { en: "Hourly roll-up", zh: "每小時彙總" };
  if (u === "ms" || u === "seconds") return { en: "Every 30 sec", zh: "每 30 秒" };
  return DEFAULT_FREQ;
}

function buildIndex() {
  const byId = new Map<string, IndicatorMeta>();

  for (const skill of SKILL_SCENARIOS) {
    const id = skill.indicator.monitor_id;
    const existing = byId.get(id) || {
      monitor_id: id,
      description: skill.indicator.why || skill.description,
      risk_scenarios: [],
      combinations: [],
      frequency: DEFAULT_FREQ.en,
      frequency_zh: DEFAULT_FREQ.zh,
    };
    if (!existing.description) existing.description = skill.description;
    const scenarioLine = skill.name;
    if (!existing.risk_scenarios.includes(scenarioLine)) existing.risk_scenarios.push(scenarioLine);
    for (const fault of skill.fault_areas.slice(0, 3)) {
      if (!existing.risk_scenarios.includes(fault)) existing.risk_scenarios.push(fault);
    }
    if (skill.related_indicators.length) {
      const combo: IndicatorCombo = {
        code: skill.code,
        name: skill.name,
        mode: "together",
        partners: skill.related_indicators,
        summary: `Often co-fires with ${skill.related_indicators.join(", ")}`,
      };
      if (!existing.combinations.some((c) => c.code === combo.code)) existing.combinations.push(combo);
    }
    byId.set(id, existing);
  }

  for (const linked of LINKED_SCENARIOS) {
    const ids = linked.sequence.map((s) => s.monitor_id);
    const unique = [...new Set(ids)];
    const isSequence = linked.sequence.length > 1 && linked.sequence.some((s, i, arr) => i > 0 && s.t_minutes > arr[0].t_minutes);
    for (const id of unique) {
      const existing = byId.get(id) || {
        monitor_id: id,
        description: FALLBACK_DESCRIPTION[id] || linked.description,
        risk_scenarios: [],
        combinations: [],
        frequency: DEFAULT_FREQ.en,
        frequency_zh: DEFAULT_FREQ.zh,
      };
      if (!existing.risk_scenarios.includes(linked.name)) existing.risk_scenarios.push(linked.name);
      const partners = unique.filter((x) => x !== id);
      const combo: IndicatorCombo = {
        code: linked.code,
        name: linked.name,
        mode: isSequence ? "sequence" : "together",
        partners,
        summary: isSequence
          ? `Sequence: ${linked.sequence.map((s) => `${s.monitor_id}@${s.t_minutes}m`).join(" → ")}`
          : `Together: ${unique.join(" + ")}`,
      };
      if (!existing.combinations.some((c) => c.code === combo.code)) existing.combinations.push(combo);
      byId.set(id, existing);
    }
  }

  return byId;
}

const INDEX = buildIndex();

export function getIndicatorMeta(
  monitorId: string,
  opts?: { unit?: string | null; name?: string | null }
): IndicatorMeta {
  const base = INDEX.get(monitorId);
  const freq = frequencyFor(monitorId, opts?.unit);
  if (base) {
    return {
      ...base,
      description: base.description || FALLBACK_DESCRIPTION[monitorId] || opts?.name || monitorId,
      risk_scenarios: base.risk_scenarios.slice(0, 5),
      combinations: base.combinations.slice(0, 4),
      frequency: freq.en,
      frequency_zh: freq.zh,
    };
  }
  return {
    monitor_id: monitorId,
    description: FALLBACK_DESCRIPTION[monitorId] || `Monitors ${opts?.name || monitorId} against configured warn/breach thresholds.`,
    risk_scenarios: ["Threshold breach on this indicator"],
    combinations: [],
    frequency: freq.en,
    frequency_zh: freq.zh,
  };
}
