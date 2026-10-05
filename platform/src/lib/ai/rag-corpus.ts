export type RagCorpusDoc = {
  doc_key: string;
  title: string;
  category: string;
  product_scope: string;
  content: string;
  source_ref: string;
  tags: string[];
};

/** Seed + desk-chat corpus. Safe to import from client (no SQLite). */
export const SEED_RAG_DOCS: RagCorpusDoc[] = [
  {
    doc_key: "biz-overview",
    title: "Vantage Markets — Business Overview",
    category: "BUSINESS",
    product_scope: "CFD+CRYPTO",
    source_ref: "https://www.vantagemarkets.com/en/",
    tags: ["company", "cfd", "broker", "外匯", "券商"],
    content: `Vantage Markets is an international online CFD and forex broker founded around 2009. It offers 1,000+ CFD instruments across forex, indices, commodities, share CFDs, ETFs, bonds and crypto CFDs (region-dependent). The brand also operates / is building crypto exchange capabilities (matching, wallets, liquidations) that must be covered by CRMP. Positioning: award-winning broker, multi-platform (MT4, MT5, TradingView, Vantage App, Web Trading), copy trading, and Scuderia Ferrari HP partnership. US persons are geo-blocked on the international site.`,
  },
  {
    doc_key: "crmp-admin-purpose",
    title: "CRMP Admin — Purpose",
    category: "OPS",
    product_scope: "PLATFORM",
    source_ref: "internal://crmp/prd",
    tags: ["crmp", "purpose", "admin", "spine", "用途", "後台", "目的"],
    content: `CRMP (Centralised Risk Management Platform) Admin is the control plane for a forex CFD broker and a crypto exchange risk desk. Problem: alarm → root cause → action is fragmented across Monitor 2.0, chat, and irreversible trading/wallet controls. Purpose: (1) turn Monitor alarms into explainable RCA, (2) challenge high-severity RCA with a second AI, (3) let operators triage in messenger, (4) enforce maker/checker and keep AI off human-only surfaces, (5) leave one spine + audit trail, (6) give every desk function a named admin page. CRMP consumes Monitor 2.0; it does not replace it. This build is a prototype: Lark webhooks, LP/symbol/wallet writes and SSO are mocked. Named owner: demo platform owner (haixiang.yan@hytechc.com).`,
  },
  {
    doc_key: "crmp-built-surface",
    title: "CRMP Admin — What Has Been Built",
    category: "OPS",
    product_scope: "PLATFORM",
    source_ref: "internal://crmp/admin-map",
    tags: ["built", "shipped", "pages", "prototype", "已建", "功能"],
    content: `Shipped in this prototype: Admin Home (RACI + spine), Daily Performance, Monitor 2.0 catalogue + Live Alerts + Detectors, Market Intelligence 5-min scan, Risk Log, Risk Domains (CFD+crypto), AI Analyses with second-AI challenger, SKILL.md playbooks + Knowledge Tree + RAG corpus, AI Admin maker/checker, Human Intervention queue, Demo Messenger (Lark lookalike with thinking animation), Escalation routes, Lark channel registry, Spine + Audit, org (departments/teams/roles/users), Data Sources, grouped Platform Settings, AI access blocklist, bilingual EN/繁中 chrome, selection AI chatbot, docs (TSD/PRD/User Guide/UAT/Ecosystem/Roadmap/URL catalog), GitHub Pages public snapshot. Not live: production Lark cards (RM-01), Monitor webhook write-back (RM-02), billed LLM RCA (RM-03), independent vendor challenger (RM-04), SSO/SCIM (RM-05), Postgres (RM-06), real halt/leverage/LP/withdrawal adapters (RM-09). Persistence is SQLite on localhost; Pages is a static snapshot.`,
  },
  {
    doc_key: "accounts-pricing",
    title: "Account Types & Pricing Model",
    category: "PRODUCT",
    product_scope: "CFD",
    source_ref: "https://www.vantagemarkets.com/en/trading/accounts/",
    tags: ["accounts", "raw-ecn", "stp", "pro-ecn", "cent", "swap-free", "帳戶"],
    content: `Account types: Standard STP (spreads from ~1.0–1.1 pips, no commission, min deposit ~$50), Raw ECN (spreads from 0.0 + ~$3/lot/side), Pro ECN (spreads from 0.0 + ~$1.50/lot/side, typically $10k funding prerequisite), Cent accounts (balance in cents), Swap Free (Islamic). Demo accounts with virtual funds available. Leverage is entity-dependent: often up to 1:500 offshore (VFSC/CIMA), 1:30 retail under FCA/ASIC. Risk implication: mixing entity leverage packs, or applying an offshore 1:500 cut to an FCA book, is a control error. CRMP skills that suggest leverage change must check entity + retail vs professional.`,
  },
  {
    doc_key: "xauusd247",
    title: "XAUUSD247 Product Controls",
    category: "PRODUCT",
    product_scope: "CFD",
    source_ref: "https://www.vantagemarkets.com/en/commodities-trading/gold-trading/xauusd24-7/",
    tags: ["gold", "xauusd247", "exposure-limits", "weekend", "黃金"],
    content: `XAUUSD247 is Vantage's 24/7 gold CFD including weekends. Contract size 1 oz (vs 100 oz traditional XAUUSD). No separate commission; costs via spread + swap. Tiered leverage by position size (up to ~1:500 on small size). Exposure limits: 15,000 lots net / 30,000 lots gross per login; when hit, account enters close-only mode. Available on MT5, Vantage App and Web. Weekend cashback promotions may increase weekend activity and gap risk. Indicator M2-XAU-247 tracks net exposure (warn 10k / breach 15k lots). Weekend gaps can create negative-balance clusters if stops cannot fill.`,
  },
  {
    doc_key: "copy-trading",
    title: "Copy Trading Cascade Risk",
    category: "RISK_POLICY",
    product_scope: "CFD",
    source_ref: "https://www.vantagemarkets.com/en/trading-platform/copy-trading/",
    tags: ["copy-trading", "concentration", "signal-provider", "跟單"],
    content: `Copy trading lets Copiers automatically replicate Signal Provider portfolios. Min copy amount from ~USD50. Providers need min deposit ~USD500 and experience checks. Concentration risk: if one provider attracts a large share of copy equity, a losing streak or style break cascades to many copiers and can spike margin utilisation / stop-outs. Known control: impose per-provider copier equity caps, pause new copies, require dual-control before lifting caps. CRMP indicator M2-COPY-009 tracks top provider concentration (warn 15% / breach 25%). Linked to M2-MRG-014 when stressed accounts share a provider.`,
  },
  {
    doc_key: "margin-stopout",
    title: "Margin Call & Stop-Out Playbook",
    category: "RISK_POLICY",
    product_scope: "CFD",
    source_ref: "internal://risk-policies/margin",
    tags: ["margin", "stop-out", "credit", "保證金", "強平", "stopout"],
    content: `Raw/Pro ECN typical margin call 50% / stop-out 20%; Standard STP stop-out often 50%. Spike in accounts >90% utilisation during US open often coincides with high-impact macro (NFP, FOMC, CPI) or gold/index volatility. Known paths: (1) verify feed not stale (M2-FEED-003), (2) check cluster of copy followers (M2-COPY-009), (3) confirm no LP reject storm forcing B-book gap (M2-LP-022, M2-HEDGE-007), (4) if organic event risk — monitor only + Lark notify; if toxic cluster — tighten group leverage / disable new exposure (human gate). Indicators: M2-MRG-014 (accounts >90% util, warn 50 / breach 100), M2-STOP-018 (stop-outs per 5m, warn 20 / breach 40). Do not auto-cut leverage on a single VIP or contest book.`,
  },
  {
    doc_key: "lp-hedge",
    title: "LP Reject & Hedge Coverage",
    category: "RISK_POLICY",
    product_scope: "CFD",
    source_ref: "internal://lp/onezero",
    tags: ["lp", "hedge", "onezero", "bridge", "a-book", "b-book", "流動性"],
    content: `Client flow is aggregated via bridges (e.g. oneZero) to prime-of-prime LPs. Rising LP reject rate or hedge coverage below target (warn <85%, breach <70%) indicates inventory / connectivity / LP health issues. A-book ratio (M2-ABOOK-008) falling toward 30% means more inventory retained B-book — P&L swings with client toxicity. Actions: check Equinix/server latency (M2-BRIDGE-LAT), disable unhealthy LP endpoint, widen spreads or halt symbols, page Trading Infra. Do not auto-disable LP without System confirmation unless reject rate CRITICAL. Skills may suggest A-book increase; in this prototype that queues a human gate and does not move the book.`,
  },
  {
    doc_key: "crypto-wallet",
    title: "Crypto Hot Wallet Float Policy",
    category: "RISK_POLICY",
    product_scope: "CRYPTO",
    source_ref: "internal://crypto-exchange/wallets",
    tags: ["crypto", "wallet", "custody", "float", "熱錢包", "出金"],
    content: `Hot wallet float ratio = hot balances / total custody. Warn ~15%, breach ~25% (M2-CRYPTO-WALLET). Elevated float increases theft/hack loss severity. Known remediation: initiate cold sweep to reduce hot float below warn, pause large withdrawals temporarily, notify Crypto Exchange Risk + System via Lark. Always require human confirmation before pausing withdrawals. Watch M2-CRYPTO-DEP (deposits 1h) and M2-WD-015 (withdrawals 1h) together — a deposit spike with rising hot float and a withdrawal queue is a classic run / exploit pattern. Never give the AI service role pause-withdrawal permission.`,
  },
  {
    doc_key: "entities-leverage",
    title: "Multi-Entity Regulation & Leverage Caps",
    category: "REGULATORY",
    product_scope: "CFD+CRYPTO",
    source_ref: "https://www.vantagemarkets.com/en/regulations/",
    tags: ["asic", "fca", "vfsc", "cima", "fsca", "leverage", "實體", "槓桿"],
    content: `Vantage operates via multiple entities (ASIC, FCA UK site, FSCA, CIMA, VFSC/international). International site users are not under FCA FOS/FSCS. Retail leverage caps differ by entity (FCA/ASIC retail often 1:30 majors / 1:20 gold / 1:2 crypto CFDs; offshore may be 1:500). Any AI suggestion to raise leverage must check client entity and classification (retail vs professional). Product availability (e.g. crypto CFDs, XAUUSD247) is jurisdiction-dependent. Client-money segregation (M2-SEG-025) and entity capital buffer (M2-CAP-024, warn 20% / breach 15%) are REG_CAPITAL domain. Wrong-entity Ack is a skip-risk on the roadmap.`,
  },
  {
    doc_key: "platforms",
    title: "Platform Stack & Failure Modes",
    category: "TECH",
    product_scope: "CFD+CRYPTO",
    source_ref: "https://www.vantagemarkets.com/en/trading-platform/",
    tags: ["mt4", "mt5", "tradingview", "app", "web", "feed", "報價"],
    content: `Platforms: MT4, MT5, TradingView (live execution), Vantage App, Vantage Web Trading, Forex VPS for EAs. Stale quotes / feed gaps often surface first on Manager API vs LP feed divergence (M2-FEED-003 warn 3 / breach 10 symbols). Copy mode and manual mode share app events. Slippage on majors (M2-SLIP-021 warn 2 / breach 3.5 pips) is an execution-quality signal that often precedes complaint spikes and LP reject storms. Infra incidents should page Trading Infra P1 Lark channel. Trading API error rate is M2-API-023.`,
  },
  {
    doc_key: "promos-abuse",
    title: "Promotions & Abuse Patterns",
    category: "FRAUD",
    product_scope: "CFD",
    source_ref: "https://www.vantagemarkets.com/en/promotions/",
    tags: ["deposit-bonus", "v-points", "referral", "abuse", "優惠", "套利"],
    content: `Promos include deposit bonus, refer-a-friend, Vantage Rewards (V-Points), Gold 24/7 cashback. Abuse patterns: multi-account bonus farming, referral rings, cent-account scaling, hedging bonus across correlated symbols. Multi-account cluster score (M2-FRAUD-011) WARN at 0.7 / BREACH 0.85. Bonus converted to cash (M2-BONUS-013) warn $75k / breach $150k per 24h. Path: freeze payout of bonus, link CRM KYC cluster, Ops investigation — do not auto-ban without Ops Lead. Payment fraud model is M2-PAY-017.`,
  },
  {
    doc_key: "macro-event-risk",
    title: "Macro Event Windows & Price Jumps",
    category: "MARKET",
    product_scope: "CFD+CRYPTO",
    source_ref: "https://www.vantagemarkets.com/en/economic-calendar/",
    tags: ["macro", "nfp", "fomc", "cpi", "gap", "宏觀"],
    content: `High-impact events (NFP, FOMC, CPI, central bank rates) cause spread blowouts, gaps, and margin spikes — especially on gold, USD pairs, US indices. Before attributing drawdown or margin breaches to toxic flow, check economic calendar within ±60 minutes. If event coincides, prefer monitoring + communication over punitive client actions. Market Intelligence scanner (5-min heuristic, M2-MKT-INTEL) pushes format (i)–(vi) to oc_market_intelligence. Licensed scored feeds are RM-15. Gap exposure USD is M2-GAP-012 (warn $1m / breach $2m).`,
  },
  {
    doc_key: "escalation-spine",
    title: "CRMP Escalation Spine",
    category: "OPS",
    product_scope: "PLATFORM",
    source_ref: "internal://crmp/escalation",
    tags: ["monitor2", "lark", "sla", "ai", "脊柱", "升級"],
    content: `Spine: Monitor 2.0 alarm → CRMP ticket → AI analysis (skill match OR RAG) → second-AI challenger on BREACH/CRITICAL → Lark/Demo Messenger notify → human gate for high impact → audit + daily dashboard. Departments: Risk Control, Operations, AI, System. Typical operator path: Ack or Escalate on the messenger card → Human Intervention if gated (maker) → a different checker if required. SLA clocks live on Escalation Routes. Timestamps exist; token cost / p95 RCA SLOs are RM-14.`,
  },
  {
    doc_key: "cfd-broker-rm",
    title: "Forex CFD Broker Risk Management",
    category: "RISK_POLICY",
    product_scope: "CFD",
    source_ref: "internal://crmp/risk-domains",
    tags: ["forex", "fx", "cfd", "broker", "risk", "外匯", "差價合約", "風控"],
    content: `A forex/CFD broker risk book has two P&L engines: B-book (internalises client flow) and A-book (hedges to LPs). Core desks: market/pricing (VaR, gaps, stale/crossed quotes, slippage), credit/client (margin, stop-out, NBP, copy cascade, latency arb), liquidity/hedge (LP rejects, coverage, A-book ratio), product config (leverage groups, swaps, weekend gold), fraud/conduct (multi-account, bonus, wash), ops (funding, recon, withdrawals), tech (bridge latency, APIs), regulatory (entity leverage, client-money segregation, capital). Typical containments — all human-gated in CRMP: group leverage tighten, symbol halt / close-only, pre-widen spreads, pause new copies, LP disable, A-book increase. Never confuse organic news vol with toxic flow. CRMP Risk Domains page catalogues these; Monitor 2.0 holds the indicator thresholds.`,
  },
  {
    doc_key: "crypto-exchange-rm",
    title: "Crypto Exchange Risk Management",
    category: "RISK_POLICY",
    product_scope: "CRYPTO",
    source_ref: "internal://crmp/crypto-exchange",
    tags: ["crypto", "exchange", "perp", "perpetual", "交易所", "永續"],
    content: `A crypto exchange (spot + perps) risk stack differs from CFD: matching engine fairness, mark-price oracles, liquidation engine, insurance fund, auto-deleveraging (ADL), wallet custody (hot/warm/cold), deposit/withdrawal rails, open-interest concentration, market integrity (wash, spoof, collusion). CRMP domain CRYPTO_EXCHANGE owns: M2-CRYPTO-WALLET (hot float), M2-CRYPTO-LIQ (liq backlog warn 50 / breach 200 orders), M2-CRYPTO-ORACLE (mark lag warn 1s / breach 2s), M2-CRYPTO-INS (insurance fund daily DD warn 4% / breach 8%), M2-CRYPTO-OI (top account OI share warn 20% / breach 35%), M2-CRYPTO-DEP (deposits 1h). Perp leverage and funding-rate squeezes can cascade like copy-trading. Pause large withdrawals and pause new high-leverage perps are human gates. Channel: oc_crypto_exchange_risk.`,
  },
  {
    doc_key: "crypto-liquidation",
    title: "Crypto Liquidation Engine & Insurance Fund",
    category: "RISK_POLICY",
    product_scope: "CRYPTO",
    source_ref: "internal://crypto-exchange/liquidations",
    tags: ["liquidation", "insurance", "adl", "mark", "oracle", "強平", "保險基金"],
    content: `When mark price (index + basis, oracle-backed) crosses maintenance margin, the liquidation engine closes the position. Backlog (M2-CRYPTO-LIQ) means the engine cannot keep up — residual becomes insurance-fund drawdown (M2-CRYPTO-INS) then ADL of opposing winners. Oracle lag (M2-CRYPTO-ORACLE) can liquidate the wrong side. Playbook: (1) confirm mark vs index vs last trade, (2) halt new high-leverage perps if backlog ≥200, (3) freeze affected contracts to close-only if oracle lag ≥2s, (4) page Crypto Exchange Risk + Trading Infra. Do not auto-ADL. Insurance-fund DD ≥8% is BREACH — exec visibility via oc_exec_risk_bridge if also wallet or OI stressed.`,
  },
  {
    doc_key: "cfd-nbp-gap",
    title: "Negative Balance, Gaps and VaR",
    category: "RISK_POLICY",
    product_scope: "CFD",
    source_ref: "internal://risk-policies/nbp",
    tags: ["nbp", "negative-balance", "gap", "var", "負餘額", "缺口"],
    content: `Negative-balance protection (NBP) writes client equity up to zero after a gap the stop could not fill — the loss sits on the house. M2-NBP-016 warn 2 / breach 5 concurrent NBP accounts. ≥5 usually means systemic gap/feed/liq failure, not one VIP. Correlate M2-GAP-012, M2-STOP-018, M2-FEED-003. Apply entity NBP policy (Ops) then close-only on affected symbols until marks validate (Risk, human). 1-day VaR utilisation (M2-VAR-002 warn 85% / breach 95%) and correlation drift (M2-CORR-004) are MARKET_PRICING early warning that the book is crowded the same way as the gap. Company equity drawdown M2-EQ-001 warn 3% / breach 5%.`,
  },
  {
    doc_key: "stale-quotes-slippage",
    title: "Stale Quotes, Slippage and Toxic Flow",
    category: "RISK_POLICY",
    product_scope: "CFD",
    source_ref: "internal://risk-policies/pricing",
    tags: ["stale", "slippage", "toxic", "latency-arb", "滑點", "延遲"],
    content: `Stale or crossed quotes let clients pick off the book (latency arb). M2-FEED-003 counts stale symbols; M2-SLIP-021 average client slippage on majors; M2-ARB-026 latency-arb toxicity score (warn 0.5 / breach 0.7). If slippage ≥3.5 pips with healthy LP rejects, the desk is over-internalising; if LP rejects are also up, the bridge is sick. Controls: pull symbol to close-only, widen, switch LP, or halt. Do not treat EA/VPS clients as fraud solely on speed — check whether the quote was actually stale. Spread vs session median (M2-SPREAD-005) blowing out is often news, not a bug.`,
  },
  {
    doc_key: "wash-collusion",
    title: "Wash Trading, Collusion and Market Integrity",
    category: "FRAUD",
    product_scope: "CFD+CRYPTO",
    source_ref: "internal://risk-policies/integrity",
    tags: ["wash", "collusion", "integrity", "對倒", "操縱"],
    content: `Wash/collusion score M2-WASH-020 warn 0.55 / breach 0.75 covers CFD books and crypto matching. Patterns: round-trip volume with no economic purpose, related KYC cluster hitting both sides of a thin book, copy-provider plus own copier accounts. On the exchange, this is market-integrity / surveillance; on CFD it is often bonus or P&L harvesting against B-book. Path: freeze bonus conversion, flag accounts for Ops Lead, do not auto-ban. Payment-fraud model (M2-PAY-017) is a separate rail (cards/e-wallets) that can fund the same cluster.`,
  },
  {
    doc_key: "client-money-capital",
    title: "Client Money Segregation & Entity Capital",
    category: "REGULATORY",
    product_scope: "CFD+CRYPTO",
    source_ref: "internal://risk-policies/capital",
    tags: ["segregation", "capital", "safeguarding", "客戶資金", "資本"],
    content: `Regulated entities must safeguard client money separately from house funds. M2-SEG-025 tracks segregation gap (warn $50k / breach $250k). A non-zero gap is an Ops + Risk P1 even if trading P&L is fine. Entity capital buffer M2-CAP-024 warn 20% / breach 15%. Crypto custody is not the same legal construct as CFD client money — hot-wallet float is theft severity, segregation is regulatory. Never let an AI-suggested withdrawal pause be the only response to a segregation breach; recon and bank-letter evidence belong to Operations.`,
  },
  {
    doc_key: "group-leverage-halt",
    title: "Group Leverage, Symbol Halt and Close-Only",
    category: "RISK_POLICY",
    product_scope: "CFD+CRYPTO",
    source_ref: "internal://risk-policies/controls",
    tags: ["group", "leverage", "halt", "close-only", "kill-switch", "組別", "停牌"],
    content: `Trading groups (MT4/MT5) bind leverage, margin, swaps and execution mode. Temporary group leverage cuts are the standard credit-cascade control. Symbol halt stops new risk; close-only lets clients reduce. Pre-widen slows new positions without a hard halt. On crypto perps, pause new high-leverage listings is the analogue. In this CRMP prototype those actions queue on Human Intervention / messenger recommended buttons and execute as EXECUTED_AFTER_APPROVAL — they do not call the bridge, manager API, or wallet. Live adapters + kill-switch are RM-09 and out of this UAT window. AI service role is blocked from halt / close-only.`,
  },
];

function tokenize(query: string): string[] {
  const lower = query.toLowerCase();
  const latin = lower
    .replace(/[^a-z0-9%\-\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2);
  const cjkMatches = [...lower.matchAll(/[\u4e00-\u9fff]{2,}/g)].map((m) => m[0]);
  const grams: string[] = [];
  for (const s of cjkMatches) {
    grams.push(s);
    if (s.length >= 3) {
      for (let i = 0; i <= s.length - 2; i++) grams.push(s.slice(i, i + 2));
    }
  }
  return [...new Set([...latin, ...grams])];
}

export function retrieveDeskCorpus(
  query: string,
  limit = 3
): Array<{ title: string; content: string; doc_key: string }> {
  const tokens = tokenize(query);
  if (!tokens.length) return [];
  const q = query.toLowerCase();
  const scored = SEED_RAG_DOCS.map((d) => {
    const hay = `${d.title} ${d.content} ${d.tags.join(" ")}`.toLowerCase();
    let hits = 0;
    for (const t of tokens) {
      if (hay.includes(t)) hits += t.length > 8 ? 2 : 1;
    }
    for (const tag of d.tags) {
      if (q.includes(tag.toLowerCase())) hits += 2;
    }
    return { d, hits };
  })
    .filter((x) => x.hits > 0)
    .sort((a, b) => b.hits - a.hits)
    .slice(0, limit);
  return scored.map((x) => ({ title: x.d.title, content: x.d.content, doc_key: x.d.doc_key }));
}
