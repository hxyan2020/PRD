window.TRN_MEASURES = {
  "cfd-spoofing": [
    { text: "DMA: max OTR and cancel-to-order caps per symbol and per session, with kill-switch.", severity: "high", trigger: "Breach", owner: "Risk", event: "Repeat spoof or related-account wall" },
    { text: "Minimum resting time (e.g. 400–1000 ms) on displayed size above a notional threshold.", severity: "standing", trigger: "Always on", owner: "Product", event: "Prevents the class of attack" },
    { text: "Self-match prevention and related-account aggregation before the OTR test.", severity: "standing", trigger: "Always on", owner: "SYS", event: "Prevents the class of attack" },
    { text: "Do not show aggregated multi-LP depth to clients who can also hit those LPs.", severity: "standing", trigger: "Always on", owner: "Product", event: "Prevents the class of attack" },
    { text: "Charge message fees or throttle after warn OTR.", severity: "elevated", trigger: "Warn", owner: "SYS", event: "Single-account OTR warn, first episode" },
    { text: "Train LPs to fade sudden one-sided walls that never trade.", severity: "elevated", trigger: "Warn", owner: "Execution", event: "Visible wall, no fills yet" }
  ],
  "cfd-last-look": [
    { text: "Prefer firm / no-last-look streams for retail and for any quote marketed as tradable.", severity: "standing", trigger: "Always on", owner: "Product", event: "Prevents the class of attack" },
    { text: "Hard cap hold time (e.g. 25–40 ms streamed FX) and auto-reject to a backup LP after timeout.", severity: "standing", trigger: "Always on", owner: "SYS", event: "Prevents the class of attack" },
    { text: "Symmetry rule: if you reject on adverse movement you must also reject on favourable movement of the same size.", severity: "standing", trigger: "Always on", owner: "Product", event: "Prevents the class of attack" },
    { text: "Publish reject-rate and hold-time SLAs in the LP scorecard; route away automatically.", severity: "elevated", trigger: "Warn", owner: "Execution", event: "One LP failing hold/reject SLA" },
    { text: "Separate credit last-look (rare, documented) from price last-look (discouraged).", severity: "standing", trigger: "Always on", owner: "Product", event: "Prevents the class of attack" },
    { text: "For B-book: ban using a faster primary feed to decide accepts after the client has hit a slower quote.", severity: "high", trigger: "Breach", owner: "CO", event: "Proven look-ahead accept/reject" }
  ],
  "cfd-stop-hunt": [
    { text: "Do not publish precise individual-level liq maps; bucket and delay if you publish anything.", severity: "standing", trigger: "Always on", owner: "Product", event: "Prevents the class of attack" },
    { text: "Randomise stop-trigger (limit-stop, peg, or small time jitter) so the cluster is not a single tick.", severity: "standing", trigger: "Always on", owner: "Product", event: "Prevents the class of attack" },
    { text: "Cap leverage into known event windows; pre-emptively flatten toxic concentration.", severity: "elevated", trigger: "Warn", owner: "Risk", event: "Clustered stops + event window" },
    { text: "Route stop-outs as limits or TWAP rather than one market dump where possible.", severity: "high", trigger: "Breach", owner: "SYS", event: "Stops firing, impulse underway" },
    { text: "Information barriers: house book cannot see client stop distribution in real time.", severity: "standing", trigger: "Always on", owner: "CO", event: "Prevents the class of attack" },
    { text: "Guaranteed-stop product should be warehouse-hedged, not used as a house lottery.", severity: "high", trigger: "Breach", owner: "Legal", event: "House PnL tracks retail stop-outs" }
  ],
  "cfd-mark-close": [
    { text: "Use robust marks: median of several venues, trimmed TWAP, or official auction — not last trade.", severity: "standing", trigger: "Always on", owner: "Product", event: "Prevents the class of attack" },
    { text: "Lengthen funding/settle windows and randomise start by a few seconds if you control the formula.", severity: "standing", trigger: "Always on", owner: "Product", event: "Prevents the class of attack" },
    { text: "Cap any single account's share of the window (e.g. 10–15%).", severity: "elevated", trigger: "Warn", owner: "Risk", event: "One family dominating the window" },
    { text: "Margin add-ons into known close dates for concentrated books.", severity: "elevated", trigger: "Warn", owner: "Risk", event: "Concentrated book into official print" },
    { text: "Independent price source for house books; no trader-editable marks without CO2.", severity: "high", trigger: "Breach", owner: "CO", event: "Manual mark override in house favour" },
    { text: "Pre-announce roll methodology; publish bid/offer and volume.", severity: "standing", trigger: "Always on", owner: "Product", event: "Prevents the class of attack" }
  ],
  "cfd-wash-ib": [
    { text: "Pay IBs on net new equity or qualified lots, not raw volume.", severity: "standing", trigger: "Always on", owner: "Product", event: "Prevents the class of attack" },
    { text: "Self-match prevention across the beneficial-owner graph, not per login.", severity: "standing", trigger: "Always on", owner: "SYS", event: "Prevents the class of attack" },
    { text: "Bonus wagering that excludes related-account and sub-1-minute round trips.", severity: "standing", trigger: "Always on", owner: "Fraud", event: "Prevents the class of attack" },
    { text: "STP: disclose and block self-hits before they reach the LP.", severity: "elevated", trigger: "Warn", owner: "SYS", event: "First self-hit / circular lots" },
    { text: "Monthly IB forensic: top 20 IBs by lots/PnL anomaly.", severity: "elevated", trigger: "Warn", owner: "CO", event: "IB payout vs spread looks wrong" },
    { text: "Device fingerprint + withdrawal lock on clustered accounts.", severity: "high", trigger: "Breach", owner: "Fraud", event: "Confirmed related-account wash" }
  ],
  "cfd-cross-underlying": [
    { text: "Composite mids: ≥3 independent sources, median or trimmed mean, max source weight 40%.", severity: "standing", trigger: "Always on", owner: "Product", event: "Prevents the class of attack" },
    { text: "Document the mark hierarchy in the product spec — no silent last-trade marks.", severity: "standing", trigger: "Always on", owner: "Product", event: "Prevents the class of attack" },
    { text: "Higher margin on CFDs whose source ADV is low.", severity: "standing", trigger: "Always on", owner: "Risk", event: "Prevents the class of attack" },
    { text: "Stale-source logic: if a venue does not update, drop it from the basket.", severity: "elevated", trigger: "Warn", owner: "SYS", event: "One source silent or deviant" },
    { text: "Do not auto-hedge 100% of a spike on the same LP that just printed it.", severity: "high", trigger: "Breach", owner: "Risk", event: "Hedge walking the printed spike" },
    { text: "Liquidation hold if mark diverges from composite beyond a band.", severity: "critical", trigger: "Cascade", owner: "SYS", event: "Clients being stopped on a single-venue smash" }
  ],
  "cfd-funding-roll": [
    { text: "Clamp funding (e.g. ±0.75% per 8h) and use a multi-venue premium TWAP of 15–60 minutes.", severity: "standing", trigger: "Always on", owner: "Product", event: "Prevents the class of attack" },
    { text: "Swap rates from an independent tom-next source plus a disclosed pad.", severity: "standing", trigger: "Always on", owner: "Product", event: "Prevents the class of attack" },
    { text: "Publish the exact formula and the venues in it.", severity: "standing", trigger: "Always on", owner: "Product", event: "Prevents the class of attack" },
    { text: "Auction the roll rather than a last-look house price.", severity: "standing", trigger: "Always on", owner: "Product", event: "Prevents the class of attack" },
    { text: "Position caps as % of OI in the last hour of the window.", severity: "elevated", trigger: "Warn", owner: "Risk", event: "One cluster parking into funding" },
    { text: "Charge a penalty on inventory that is opened < 30 minutes before funding and closed < 30 minutes after.", severity: "high", trigger: "Breach", owner: "Risk", event: "Repeat harvest, flatten-after confirmed" }
  ],
  "cfd-liq-cascade": [
    { text: "Size the insurance fund to stress (see existing stress_testing.py patterns).", severity: "standing", trigger: "Always on", owner: "CRO", event: "Prevents the class of attack" },
    { text: "Dynamic leverage: cut max leverage as OI-at-risk rises.", severity: "elevated", trigger: "Warn", owner: "Risk", event: "OI-at-risk crossing warn band" },
    { text: "Liquidate with limits / staggered clips, not one market order.", severity: "high", trigger: "Breach", owner: "SYS", event: "First liq wave underway" },
    { text: "Partial close and margin call before full wipe where the licence allows.", severity: "high", trigger: "Breach", owner: "Risk", event: "Maintenance breach, book still salvageable" },
    { text: "Mark freeze and liq hold when composite diverges.", severity: "critical", trigger: "Cascade", owner: "SYS", event: "Mark vs composite blown, cascade starting" },
    { text: "ADL only after insurance; publish the rank formula; no VIP exemptions.", severity: "critical", trigger: "Cascade", owner: "Legal", event: "Insurance exhausted, ADL about to fire" }
  ],
  "cfd-b-book-conflict": [
    { text: "Disclose hybrid booking in plain language; do not advertise DMA if B-booked.", severity: "standing", trigger: "Always on", owner: "Legal", event: "Prevents the class of attack" },
    { text: "Same quote path and hold-time cap for all segments in a product, or publish paid tiers.", severity: "standing", trigger: "Always on", owner: "Product", event: "Prevents the class of attack" },
    { text: "Hedge timers: if you B-book, you own the risk for a minimum hold (e.g. 1–5s) or you are agency.", severity: "standing", trigger: "Always on", owner: "Product", event: "Prevents the class of attack" },
    { text: "Positive-slippage symmetry on market orders.", severity: "standing", trigger: "Always on", owner: "Product", event: "Prevents the class of attack" },
    { text: "Independent conduct MI: house PnL vs client, reviewed by 2nd line — not the dealing desk.", severity: "elevated", trigger: "Warn", owner: "CO", event: "House/client PnL correlation rising" },
    { text: "Ban news-window disconnects that are client-selective.", severity: "high", trigger: "Breach", owner: "CO", event: "Only toxic/winning clients lose session on news" }
  ],
  "cfd-quote-stuff": [
    { text: "Hard message budgets and cancel-to-add fees.", severity: "standing", trigger: "Always on", owner: "SYS", event: "Prevents the class of attack" },
    { text: "Minimum quote life on displayed quotes.", severity: "standing", trigger: "Always on", owner: "Product", event: "Prevents the class of attack" },
    { text: "Per-session CPU isolation so one client cannot stall others.", severity: "standing", trigger: "Always on", owner: "Tech", event: "Prevents the class of attack" },
    { text: "Do not give retail API the same unthrottled firehose as colo DMA.", severity: "standing", trigger: "Always on", owner: "Product", event: "Prevents the class of attack" },
    { text: "Kill-switch on runaway cancel loops.", severity: "high", trigger: "Breach", owner: "SYS", event: "Peer latency inflation + cancel storm" }
  ],
  "cex-wash": [
    { text: "Pay MMs on quality (tight real spread + external hedge + impact), not raw ADV.", severity: "standing", trigger: "Always on", owner: "Product", event: "Prevents the class of attack" },
    { text: "Self-match prevention across the deposit-address graph.", severity: "standing", trigger: "Always on", owner: "SYS", event: "Prevents the class of attack" },
    { text: "Surveillance publication: quality volume vs total volume.", severity: "elevated", trigger: "Warn", owner: "Market quality", event: "Wash score in warn band" },
    { text: "For tokenised assets: disclose true free float and related-party volume.", severity: "standing", trigger: "Always on", owner: "Listings", event: "Prevents the class of attack" },
    { text: "Kill rebate tiers that invert economics (rebate > fee + spread).", severity: "standing", trigger: "Always on", owner: "Product", event: "Prevents the class of attack" },
    { text: "Do not sell 'volume' to aggregators you know is related-party.", severity: "high", trigger: "Breach", owner: "Listings", event: "Confirmed related-party tape" }
  ],
  "cex-pump": [
    { text: "Listing lock-ups and staged unlocks with public wallets.", severity: "standing", trigger: "Always on", owner: "Listings", event: "Prevents the class of attack" },
    { text: "Do not let marketing retweet paid call groups.", severity: "standing", trigger: "Always on", owner: "Marketing", event: "Prevents the class of attack" },
    { text: "On-chain watch of insider and MM wallets as a listing covenant.", severity: "elevated", trigger: "Warn", owner: "Surveillance", event: "Accumulation into a known catalyst" },
    { text: "Risk banners when social z-score and return trip the pump shape.", severity: "elevated", trigger: "Warn", owner: "SYS", event: "Social + return shape at warn" },
    { text: "Cooling-off: new listings have lower leverage and withdrawal delays for large sellers.", severity: "elevated", trigger: "Warn", owner: "Risk", event: "New listing or social spike" },
    { text: "ToS that allows clawback of wash/pump proceeds sitting on the venue.", severity: "high", trigger: "Breach", owner: "Legal", event: "Inner-ring distribution confirmed" }
  ],
  "cex-spoof": [
    { text: "Related-account aggregation for OTR and self-match.", severity: "standing", trigger: "Always on", owner: "SYS", event: "Prevents the class of attack" },
    { text: "Min resting time on size above a notional.", severity: "standing", trigger: "Always on", owner: "Product", event: "Prevents the class of attack" },
    { text: "Cross-product surveillance is mandatory if you list spot + perp.", severity: "standing", trigger: "Always on", owner: "Surveillance", event: "Prevents the class of attack" },
    { text: "Do not show spoofable 'total depth' from accounts that also have hidden perp risk.", severity: "standing", trigger: "Always on", owner: "Product", event: "Prevents the class of attack" },
    { text: "Rate-limit cancel storms.", severity: "elevated", trigger: "Warn", owner: "SYS", event: "OTR / cancel burst at warn" }
  ],
  "cex-oracle-mark": [
    { text: "Median of ≥5 quality venues; max weight 25–30%; instant exclusion on deviation.", severity: "standing", trigger: "Always on", owner: "Product", event: "Prevents the class of attack" },
    { text: "TWAP/EWMA long enough that a flash print cannot dominate (often 15–60 min for funding; shorter for liq but with a composite, not a single book).", severity: "standing", trigger: "Always on", owner: "Product", event: "Prevents the class of attack" },
    { text: "Never read a flash-loanable spot as a last price.", severity: "standing", trigger: "Always on", owner: "Product", event: "Prevents the class of attack" },
    { text: "For tokenised assets: NAV from primary/attested NAV, not from a thin secondary CEX print.", severity: "standing", trigger: "Always on", owner: "Product", event: "Prevents the class of attack" },
    { text: "Circuit breakers on mark velocity.", severity: "high", trigger: "Breach", owner: "SYS", event: "Mark velocity / constituent z-score breach" },
    { text: "Insurance / clawback if liqs fired on a later-invalidated mark.", severity: "critical", trigger: "Cascade", owner: "Risk", event: "Clients liquidated on a later-dropped print" }
  ],
  "cex-funding": [
    { text: "Multi-venue premium, 30–60 min TWAP, clamp per interval.", severity: "standing", trigger: "Always on", owner: "Product", event: "Prevents the class of attack" },
    { text: "Do not let a washable spot venue dominate premium.", severity: "standing", trigger: "Always on", owner: "Product", event: "Prevents the class of attack" },
    { text: "Align funding with an external rate for stables (SOFR-like or lending rate) plus basis, not last price.", severity: "standing", trigger: "Always on", owner: "Product", event: "Prevents the class of attack" },
    { text: "OI share caps into the window.", severity: "elevated", trigger: "Warn", owner: "Risk", event: "One cluster parking into funding" },
    { text: "Penalty fee on open/close straddling only the snapshot.", severity: "high", trigger: "Breach", owner: "Risk", event: "Repeat flatten-after harvest" }
  ],
  "cex-liq-adl": [
    { text: "Stop publishing tick-accurate liq maps.", severity: "standing", trigger: "Always on", owner: "Product", event: "Prevents the class of attack" },
    { text: "Size insurance to stress, not to marketing.", severity: "standing", trigger: "Always on", owner: "CRO", event: "Prevents the class of attack" },
    { text: "Lower max leverage as OI-at-risk rises.", severity: "elevated", trigger: "Warn", owner: "Risk", event: "OI-at-risk crossing warn band" },
    { text: "Staggered limit liqs; isolated vs cross controls.", severity: "high", trigger: "Breach", owner: "SYS", event: "First liq wave underway" },
    { text: "Pro-rata or auction liq rather than 'whoever is fastest'.", severity: "high", trigger: "Breach", owner: "Product", event: "Hunter sitting on the forced flow" },
    { text: "No ADL VIP exemptions; formula on the website and in the log.", severity: "critical", trigger: "Cascade", owner: "Legal", event: "Insurance empty, ADL firing" }
  ],
  "cex-rwa": [
    { text: "Require continuous PoR plus periodic independent confirmation of ownership (not just balances).", severity: "standing", trigger: "Always on", owner: "Custody", event: "Prevents the class of attack" },
    { text: "Mint/redeem only against pre-funded, segregated accounts; reconcile every mint to a reserve increment before tokens go live.", severity: "standing", trigger: "Always on", owner: "Product", event: "Prevents the class of attack" },
    { text: "Ban related-party volume from 'trades at NAV' marketing and from collateral eligibility tests.", severity: "standing", trigger: "Always on", owner: "Listings", event: "Prevents the class of attack" },
    { text: "If you list the token as a cash-equivalent, you own the look-through. If you cannot look through, it is a risky asset.", severity: "standing", trigger: "Always on", owner: "CRO", event: "Prevents the class of attack" },
    { text: "Public, machine-readable attestation calendar; auto-downgrade the token if a date is missed.", severity: "elevated", trigger: "Warn", owner: "SYS", event: "Stale or missed attestation" },
    { text: "Treat tokenised cash, bills, gold, funds, and wrappers as credit products: haircut, concentration limits, and a kill-switch as collateral.", severity: "critical", trigger: "Cascade", owner: "Risk", event: "Reserve gap, gate, or depeg — pull as collateral" }
  ],
  "cex-insider-unlock": [
    { text: "Need-to-know listings; watermarked CRM; access logs retained 5+ years.", severity: "standing", trigger: "Always on", owner: "CO", event: "Prevents the class of attack" },
    { text: "Staff wallet disclosure and pre-clearance; restricted list from first BD contact.", severity: "standing", trigger: "Always on", owner: "CO", event: "Prevents the class of attack" },
    { text: "Listing lock-ups in the contract with on-chain vesting that the venue can monitor.", severity: "standing", trigger: "Always on", owner: "Listings", event: "Prevents the class of attack" },
    { text: "Tokenised go-live: same insider list as a securities IPO wall-crossing log.", severity: "standing", trigger: "Always on", owner: "Legal", event: "Prevents the class of attack" },
    { text: "For unlocks: reduce leverage and raise margin T-24h to T+24h; banners on circulating supply.", severity: "elevated", trigger: "Warn", owner: "Risk", event: "Known unlock window" },
    { text: "Cooling-off on withdrawals for team wallets after listing.", severity: "high", trigger: "Breach", owner: "Trust", event: "Team/insider distribution at open" }
  ],
  "cex-sandwich": [
    { text: "For DEX routing: private order flow, MEV-protected relays, or RFQ; never naive public mempool sweeps for client size.", severity: "standing", trigger: "Always on", owner: "Execution", event: "Prevents the class of attack" },
    { text: "OTC: timestamped blotter, no house trade on the same name until the client is done (or documented riskless principal).", severity: "standing", trigger: "Always on", owner: "CO", event: "Prevents the class of attack" },
    { text: "Delay or randomise public hot-wallet sweeps if they leak pending deposits; use many deposit addresses.", severity: "standing", trigger: "Always on", owner: "Tech", event: "Prevents the class of attack" },
    { text: "Equal API market-data; paid colocation must be disclosed and not include the queue of other clients.", severity: "standing", trigger: "Always on", owner: "Product", event: "Prevents the class of attack" },
    { text: "Chinese walls: listings, OTC, and proprietary perps do not share the live client blotter.", severity: "high", trigger: "Breach", owner: "CO", event: "Internal look-ahead or VIP privilege proven" }
  ],
  "cex-depeg": [
    { text: "Haircut every 'cash-equivalent' token. Zero haircut is a choice, not a fact.", severity: "standing", trigger: "Always on", owner: "Risk", event: "Prevents the class of attack" },
    { text: "Concentration limits per issuer across spot, earn, and collateral.", severity: "standing", trigger: "Always on", owner: "Risk", event: "Prevents the class of attack" },
    { text: "Issuer playbook: transparent redeem queue, no silent gate.", severity: "standing", trigger: "Always on", owner: "Issuer", event: "Prevents the class of attack" },
    { text: "Pre-drafted client copy for depeg events — silence is a rumour amplifier.", severity: "elevated", trigger: "Warn", owner: "CO", event: "Peg warn / rumour + outflow" },
    { text: "Marks from redeemable primary + several secondaries; drop a smashed book.", severity: "high", trigger: "Breach", owner: "SYS", event: "One venue smashed, others still redeemable" },
    { text: "Pause liquidations denominated in a depegging asset until a composite is trusted.", severity: "critical", trigger: "Cascade", owner: "Risk", event: "Unit-of-account broken, liqs about to fire in it" }
  ]
};

window.TRN_SEVERITY = [
  {
    id: "standing",
    title: "Standing",
    when: "Always on",
    meaning: "Product and control design. Live before anyone pages. These do not wait for an alert.",
    apply: "Every book, every session."
  },
  {
    id: "elevated",
    title: "Elevated",
    when: "Warn",
    meaning: "First signal: one account, one window, no confirmed client wipe. Throttle, banner, cap, route away, raise margin.",
    apply: "L0–L1. Keep the tape open. Do not freeze the market yet."
  },
  {
    id: "high",
    title: "High",
    when: "Breach",
    meaning: "Pattern confirmed, related accounts, or client harm is plausible. Kill-switch the actor, stagger liqs, lock withdrawals, claw back, change the mark path.",
    apply: "L2–L4. Contain the actor. Keep honest flow alive if you can."
  },
  {
    id: "critical",
    title: "Critical",
    when: "Cascade",
    meaning: "Bad mark, cascade, missing reserves, depeg, or systemic client wipe. Freeze the engine that is doing harm, then write the case.",
    apply: "L0/L4 immediately. Liquidation hold beats a tidy L3 memo."
  }
];
