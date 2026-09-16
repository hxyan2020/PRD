window.TRN = {
  meta: {
    playbooks: 20,
    venues: 2,
    products: 6,
    levels: 6
  },
  cfd: [
    {
      id: "cfd-spoofing",
      code: "TRN-CFD-01",
      name: "Spoofing and layering",
      severity: "critical",
      products: ["spot", "margin", "perps", "futures"],
      summary: "A trader posts size they do not intend to fill, leaning the displayed book so others chase, then hits the opposite side and cancels the fake wall.",
      why: "DMA/STP CFD and futures books still show depth. Retail and mid-tier algos treat that depth as real interest. On B-book only platforms the same pattern appears when the client has an underlying venue feed or multi-LP aggregator.",
      workflow: [
        { n: "01", who: "Predator", action: "Pick a name with thin displayed depth or a retail-heavy session (index CFD at London open, exotic FX, small metals).", tell: "Average displayed size at touch is small vs. typical clip; stop density sits just beyond round numbers." },
        { n: "02", who: "Predator", action: "Take or plan a real directional clip on the side they actually want (e.g. they want to buy).", tell: "Small aggressive or mid-point fills appear first; inventory is not yet large." },
        { n: "03", who: "Algo / desk", action: "Layer oversized bids (or offers) 2–6 ticks from touch across several levels, sometimes split over child accounts or LPs.", tell: "Displayed size on one side jumps 3–10× typical; multiple new orders share size, lifetime, and cancel fingerprint." },
        { n: "04", who: "Market", action: "Other participants lean: mid/microprice drifts, queues shorten on the real side, stops and icebergs adjust.", tell: "Microprice moves toward the wall; joiners appear; opposite-side queue thins." },
        { n: "05", who: "Predator", action: "Hit or lift the now-improved opposite side (the real economic trade).", tell: "Aggressive fill occurs within seconds of the wall being most visible." },
        { n: "06", who: "Algo", action: "Cancel or amend the layers before they can be hit, often sub-second after the real fill.", tell: "Cancel-after-fill clustering; order-to-trade ratio spikes; few or zero layer fills." },
        { n: "07", who: "Desk", action: "Repeat around news, cash-close, roll, or funding when others are forced to trade.", tell: "Same account family repeats the pattern on the same symbols in the same windows." }
      ],
      participants: [
        { role: "DMA / STP client or prop desk", incentive: "Better fill on the real side without showing true demand." },
        { role: "Collusive sub-accounts or IB book", incentive: "Split the wall so no single account trips OTR limits." },
        { role: "Market-maker / LP (victim or joiner)", incentive: "Lean quotes into fake size, then get run over." },
        { role: "Retail cluster (unwitting)", incentive: "Chase the printed wall; supply the exit liquidity." },
        { role: "Broker surveillance / RO", incentive: "Must reconstruct multi-LP books, not just the house blotter." }
      ],
      detection: {
        tools: ["Nasdaq SMARTS layering module", "Eventus Validus spoofing scenarios", "NICE Actimize equities/FX MAR pack", "In-house L3 book replay (OneTick / kdb+ / QuestDB)", "Graph of account–device–IB links"],
        parameters: [
          { metric: "Order-to-trade ratio (OTR)", window: "Rolling 5 min / session", warn: "> 15:1 liquid FX/index; > 8:1 thin names", breach: "> 30:1 or > 50:1 with almost no fills", notes: "Exclude genuine icebergs if your gateway tags them." },
          { metric: "Cancel rate of non-fill orders", window: "Same side, 2–30s before opposite fill", warn: "> 80%", breach: "> 95% and median time-to-cancel < 800 ms", notes: "Pair with opposite-side aggression." },
          { metric: "Layer vs typical displayed size", window: "Per symbol, 20-day median at that level", warn: "> 3×", breach: "> 5× on 3+ levels simultaneously", notes: "Normalise by session (Asia vs NY)." },
          { metric: "Fill asymmetry", window: "Per episode", warn: "Layer fill < 10% of posted, real-side fill > 70% of intent", breach: "Zero layer fills + completed opposite sweep", notes: "Classic spoof signature." },
          { metric: "Multi-account coordination", window: "Same 2s bucket", warn: "2+ related accounts layer same side", breach: "3+ accounts or shared device/IP/beneficiary", notes: "IB hierarchies are high yield." }
        ]
      },
      escalation: [
        { lvl: "L0", when: "Real-time", who: "SYS", action: "Auto-alert; snapshot L3 book ±5s; freeze cancel-reason codes." },
        { lvl: "L1", when: "15–30 min", who: "Surveillance analyst", action: "Replay episode; score OTR, TTC, asymmetry; mark false positive if genuine pull on news." },
        { lvl: "L2", when: "Same day", who: "Senior surveillance", action: "Link accounts, devices, IB; pull voice/chat if desk-originated." },
        { lvl: "L3", when: "T+1", who: "Compliance / MLRO", action: "Open case; consider MAR/CFTC spoofing file; preserve raw drop copies." },
        { lvl: "L4", when: "Material / repeat", who: "Head of Risk + Legal", action: "Kill-switch DMA, cut clip size, notify LP/venue." },
        { lvl: "L5", when: "Egregious / cross-border", who: "Legal", action: "Regulator / venue referral (FCA, ASIC, MAS, CFTC, exchange)." }
      ],
      countermeasures: [
        "DMA: max OTR and cancel-to-order caps per symbol and per session, with kill-switch.",
        "Minimum resting time (e.g. 400–1000 ms) on displayed size above a notional threshold.",
        "Self-match prevention and related-account aggregation before the OTR test.",
        "Do not show aggregated multi-LP depth to clients who can also hit those LPs.",
        "Charge message fees or throttle after warn OTR.",
        "Train LPs to fade sudden one-sided walls that never trade."
      ]
    },
    {
      id: "cfd-last-look",
      code: "TRN-CFD-02",
      name: "Last-look and asymmetric reject",
      severity: "critical",
      products: ["spot", "margin"],
      summary: "The liquidity provider holds a client order for a last-look window, accepts when the trade is good for the LP, and rejects when the market has already moved against them.",
      why: "Core FX/CFD conflict. Last look can be a credit and stale-quote control. It becomes abuse when hold times are long and reject rates are one-sided. Retail CFDs also see requotes and 'off-market' rejects that are last look by another name.",
      workflow: [
        { n: "01", who: "Client", action: "Hits a displayed bid/offer on the broker or LP stream.", tell: "Order timestamp vs. quote ID is known." },
        { n: "02", who: "LP / B-book", action: "Holds the order (last look) while checking freshness, credit, and now-cast of the next tick.", tell: "Hold time cluster at 20–150 ms, or much longer on some names." },
        { n: "03", who: "LP", action: "If markout is favourable to the LP (client was wrong / stale), accept. If adverse, reject or requote wider.", tell: "Accepted trades show negative client markout; rejects show positive client markout." },
        { n: "04", who: "LP", action: "May hedge the accepted flow on a faster primary venue after the hold.", tell: "LP child order on primary prints just after accept." },
        { n: "05", who: "Client", action: "Receives reject/requote, chases a worse price; toxic fast clients get systematically filtered.", tell: "Same client reject rate much higher on news ticks than on quiet tape." }
      ],
      participants: [
        { role: "Prime / wholesale LP", incentive: "Avoid being run over by faster clients; keep skew." },
        { role: "CFD broker (B-book or hybrid)", incentive: "Warehouse easy flow, reject informed flow." },
        { role: "Latency-sensitive client", incentive: "Trade on a faster primary feed than the LP quote." },
        { role: "Retail client", incentive: "Thinks they have a firm price; actually has an option against them." },
        { role: "TCA / RO", incentive: "Must measure hold, reject symmetry, and markout — not just fill ratio." }
      ],
      detection: {
        tools: ["BestX / Tradefeedr / LiquidMetrix TCA", "Internal quote-to-fill ledger with quote IDs", "Clock-sync (PTP) between gateway and market data", "Port-level reject reason taxonomy"],
        parameters: [
          { metric: "Last-look hold time", window: "Per LP, per symbol, p50/p95", warn: "p95 > 50 ms (streamed FX); > 100 ms CFD", breach: "p95 > 150 ms or any hold > 400 ms without credit check flag", notes: "Mark genuine credit last-look separately." },
          { metric: "Reject rate", window: "Rolling 1h / day", warn: "> 8% liquid G10; > 15% exotics", breach: "> 20% liquid or > 35% any name", notes: "Condition on volatility regime." },
          { metric: "Reject asymmetry (win vs lose for LP)", window: "Same window, using mid at T+100ms and T+1s", warn: "P(reject | would-lose) 2× P(reject | would-win)", breach: "3× or more, statistically significant", notes: "This is the abuse statistic." },
          { metric: "Client markout of accepted flow", window: "T+100ms, T+1s, T+10s", warn: "Systematic negative client markout vs. peer LPs", breach: "Accepted markout << rejected markout by > 0.3 pip G10", notes: "Compare vs. no-last-look LPs." },
          { metric: "Requote distance", window: "Per reject", warn: "> 0.5 pip beyond new mid", breach: "Requote always worse for client, never better", notes: "One-way requote is a red flag." }
        ]
      },
      escalation: [
        { lvl: "L0", when: "Continuous", who: "SYS", action: "Publish hold/reject dashboards per LP and per desk." },
        { lvl: "L1", when: "Daily", who: "Execution analyst", action: "TCA pack; flag LPs failing symmetry." },
        { lvl: "L2", when: "Weekly / incident", who: "Head of Execution + RO", action: "LP challenge pack; request raw last-look logs." },
        { lvl: "L3", when: "Persistent", who: "Compliance", action: "Best-execution file; disclosure review of 'firm' vs indicative quotes." },
        { lvl: "L4", when: "Client harm / marketing mismatch", who: "Legal + Product", action: "Turn off last look, switch to firm liquidity, or re-paper clients." },
        { lvl: "L5", when: "Regulatory exam", who: "Legal", action: "Produce hold-time and symmetry evidence to supervisor." }
      ],
      countermeasures: [
        "Prefer firm / no-last-look streams for retail and for any quote marketed as tradable.",
        "Hard cap hold time (e.g. 25–40 ms streamed FX) and auto-reject to a backup LP after timeout.",
        "Symmetry rule: if you reject on adverse movement you must also reject on favourable movement of the same size.",
        "Publish reject-rate and hold-time SLAs in the LP scorecard; route away automatically.",
        "Separate credit last-look (rare, documented) from price last-look (discouraged).",
        "For B-book: ban using a faster primary feed to decide accepts after the client has hit a slower quote."
      ]
    },
    {
      id: "cfd-stop-hunt",
      code: "TRN-CFD-03",
      name: "Stop-hunt and momentum ignition",
      severity: "high",
      products: ["margin", "perps", "futures"],
      summary: "Aggressive clips push price through a known stop or liquidation cluster, triggering forced selling or buying, then the predator fades the move.",
      why: "Leveraged CFDs, perps, and futures concentrate stops at round numbers, session highs/lows, and published liquidation maps. Retail platforms often publish or leak those levels.",
      workflow: [
        { n: "01", who: "Predator", action: "Map stop / liq clusters from platform heatmaps, options walls, prior swing highs, and retail round numbers.", tell: "Public 'liq heatmap' or identical levels across many small accounts." },
        { n: "02", who: "Predator", action: "Build a position that profits if those stops fire (short above a long-stop cluster, etc.).", tell: "Position build is stealthy: mid, iceberg, or off-book." },
        { n: "03", who: "Predator", action: "Ignite: sweep the book toward the cluster with marketable orders, sometimes using several accounts.", tell: "Volume spike, trade-throughs, short-lived gap; little news." },
        { n: "04", who: "Platform", action: "Stops and liquidations fire, adding marketable flow in the same direction.", tell: "Stop-order share of volume jumps; margin-call / liq engine prints." },
        { n: "05", who: "Predator", action: "Fade: cover into the forced flow; price mean-reverts a large fraction of the spike.", tell: "Reversion > 50–70% of the impulse within minutes." },
        { n: "06", who: "Broker (conflict risk)", action: "If B-book, house may benefit from client stop-out; must show Chinese walls vs. house book.", tell: "House PnL spikes exactly when clustered retail stops fire." }
      ],
      participants: [
        { role: "Informed / predatory client", incentive: "Harvest stop liquidity." },
        { role: "Retail cohort", incentive: "Tight stops, high leverage — they are the fuel." },
        { role: "Liq / stop engine", incentive: "Mechanical, predictable, sometimes sequential." },
        { role: "B-book broker (conflict)", incentive: "Client losses can be house gains if not hedged." },
        { role: "Social-signal sellers", incentive: "Publish heatmaps that make clusters common knowledge." }
      ],
      detection: {
        tools: ["Stop / liq level warehouse (anonymised)", "SMARTS momentum-ignition scenario", "House vs client PnL attribution", "Book sweep detector", "News/econ calendar join"],
        parameters: [
          { metric: "Impulse then reversion", window: "30s–15 min", warn: "Sweep ≥ 1.5× ATR(1m) then revert ≥ 50%", breach: "Revert ≥ 70% with no news tag", notes: "Exclude scheduled prints (NFP, FOMC)." },
          { metric: "Stop/liq share of volume", window: "During impulse", warn: "> 25%", breach: "> 40% and initiator is a small set of accounts", notes: "Need stop-order flags." },
          { metric: "Distance of sweep to cluster", window: "Per event", warn: "Touches cluster ±0.5 tick then reverses", breach: "Overshoot cluster by tiny amount then full fade", notes: "Classic hunt." },
          { metric: "Account concentration of aggressive volume", window: "Event", warn: "Top 3 accounts > 40% of aggressive notional", breach: "> 60% or related-account graph", notes: "Split orders still link on device." },
          { metric: "B-book house PnL vs client stop-outs", window: "Day / event", warn: "House PnL correlation > 0.6 with retail stop-out notional", breach: "House trading the same levels immediately before", notes: "Conflict case — escalate Legal." }
        ]
      },
      escalation: [
        { lvl: "L0", when: "Real-time", who: "SYS", action: "Alert on impulse+reversion near known clusters." },
        { lvl: "L1", when: "30 min", who: "Surveillance", action: "News filter; identify aggressor accounts." },
        { lvl: "L2", when: "Same day", who: "RO + Market Risk", action: "If platform heatmap is public, review product design." },
        { lvl: "L3", when: "Conflict suspected", who: "Compliance", action: "B-book information barrier review; personal-account dealing check." },
        { lvl: "L4", when: "Repeat predator", who: "Risk", action: "Widen stops-only book, reduce max leverage on that name, restrict aggressor." },
        { lvl: "L5", when: "House front-ran client stops", who: "Legal / MLRO", action: "Client redress, regulator notification." }
      ],
      countermeasures: [
        "Do not publish precise individual-level liq maps; bucket and delay if you publish anything.",
        "Randomise stop-trigger (limit-stop, peg, or small time jitter) so the cluster is not a single tick.",
        "Route stop-outs as limits or TWAP rather than one market dump where possible.",
        "Cap leverage into known event windows; pre-emptively flatten toxic concentration.",
        "Information barriers: house book cannot see client stop distribution in real time.",
        "Guaranteed-stop product should be warehouse-hedged, not used as a house lottery."
      ]
    },
    {
      id: "cfd-mark-close",
      code: "TRN-CFD-04",
      name: "Marking the close, settle, and roll",
      severity: "critical",
      products: ["spot", "margin", "perps", "futures"],
      summary: "Trades are concentrated into the cash close, futures settle, CFD daily mark, or roll window to move the reference used for margin, PnL, funding, or valuation.",
      why: "CFDs inherit someone else's mark: cash index close, futures settle, broker mid, or a funding TWAP. Moving that print moves everyone else's collateral.",
      workflow: [
        { n: "01", who: "Position holder", action: "Carry a large CFD/futures position whose mark or funding depends on a known window (cash close, 16:30 London, 15:00 NY, Friday roll, 08:00 funding).", tell: "Open interest / client position is large vs. expected window volume." },
        { n: "02", who: "Trader", action: "Park or build inventory into the window; sometimes park on a related future or cash basket.", tell: "Position spikes in the last 30–60 minutes." },
        { n: "03", who: "Trader", action: "Concentrate aggressive volume in the last seconds / official auction / VWAP window.", tell: "Participation in the last 60s >> rest of day; price departs from prior VWAP." },
        { n: "04", who: "Broker systems", action: "Daily mark, variation margin, or funding uses that print.", tell: "Client equity jumps/drops with little subsequent trade." },
        { n: "05", who: "Trader", action: "Unwind after the mark; price reverts.", tell: "Reversion 15–60 minutes after the window; inventory mean-reverts." }
      ],
      participants: [
        { role: "Hedge fund / prop with dated futures", incentive: "Improve official settle for options, funds, or margin." },
        { role: "CFD desk with large client skew", incentive: "House mark can reduce margin calls or hide P&L." },
        { role: "Roll broker", incentive: "Print a roll price that favours the house bid/offer." },
        { role: "Index / auction operator", incentive: "Must run a robust close; can still be leaned on if thin." },
        { role: "Fund accountant / NAV (if tokenised later)", incentive: "Uses the same print downstream." }
      ],
      detection: {
        tools: ["Close-window participation reports", "Auction imbalance analytics", "Mark-vs-subsequent-mid reversion", "Related-instrument basis monitor", "SMARTS marking-the-close"],
        parameters: [
          { metric: "Participation in official window", window: "Last 5 min / auction / funding TWAP", warn: "> 15% of window volume", breach: "> 25% single account family or > 40% house+related", notes: "Use beneficial owner, not login." },
          { metric: "Price vs pre-window VWAP", window: "Last 60s vs prior 30 min VWAP", warn: "> 0.8 × 1-min σ", breach: "> 1.5 × 1-min σ and reverts after", notes: "Join news calendar." },
          { metric: "Post-mark reversion", window: "T+15m / T+60m", warn: "Revert ≥ 50% of window move", breach: "Revert ≥ 75% and inventory flattened", notes: "Strong intent evidence." },
          { metric: "Cross-product lean", window: "Cash vs future vs CFD", warn: "Cash print moved, future did not (or reverse) beyond typical basis", breach: "Basis blowout only inside the mark window", notes: "Classic close game." },
          { metric: "House mark discretion", window: "Daily", warn: "Manual mark overrides > 5 bps without source", breach: "Override always in house favour", notes: "Audit valuation policy." }
        ]
      },
      escalation: [
        { lvl: "L0", when: "Each window", who: "SYS", action: "Auto pack: participation, move, reversion." },
        { lvl: "L1", when: "+30 min", who: "Surveillance", action: "Filter auctions with genuine imbalance news." },
        { lvl: "L2", when: "T+0 / T+1", who: "Market Risk + Product", action: "If house mark, four-eyes re-mark from independent source." },
        { lvl: "L3", when: "Client impact", who: "Compliance", action: "Case file; consider close-price manipulation report." },
        { lvl: "L4", when: "Repeat", who: "Risk", action: "Cap clip in official windows; force algo-only; change funding TWAP design." },
        { lvl: "L5", when: "Official settle of listed future", who: "Legal", action: "Notify listing venue / regulator." }
      ],
      countermeasures: [
        "Use robust marks: median of several venues, trimmed TWAP, or official auction — not last trade.",
        "Lengthen funding/settle windows and randomise start by a few seconds if you control the formula.",
        "Cap any single account's share of the window (e.g. 10–15%).",
        "Independent price source for house books; no trader-editable marks without CO2.",
        "Pre-announce roll methodology; publish bid/offer and volume.",
        "Margin add-ons into known close dates for concentrated books."
      ]
    },
    {
      id: "cfd-wash-ib",
      code: "TRN-CFD-05",
      name: "Wash, churn, and IB rebate loops",
      severity: "high",
      products: ["spot", "margin", "perps", "futures"],
      summary: "Related accounts trade with each other or churn the same position to manufacture volume for cashback, IB commission, bonus tiers, or apparent activity.",
      why: "CFD introducing-broker economics pay on lot volume. Bonus and cashback programmes pay on notional. That is a machine for wash volume if KYC linkage is weak.",
      workflow: [
        { n: "01", who: "Organiser", action: "Open several accounts (self, mule, corporate, different IBs) that can trade the same symbol.", tell: "Shared device, IP ASN, funding source, or beneficiary." },
        { n: "02", who: "Accounts", action: "Place offsetting CFDs or rapidly flip the same clip so net risk ≈ 0 but lots print.", tell: "Inventory mean-reverts to near zero; high turnover, tiny net PnL before costs." },
        { n: "03", who: "IB / affiliate", action: "Collect volume commission or CPA true-up.", tell: "IB payout rises in lockstep with circular lots." },
        { n: "04", who: "Bonus hunter", action: "Meet wagering requirements, then withdraw.", tell: "Bonus unlocked then rapid cash-out; trades have no directional thesis." },
        { n: "05", who: "If STP", action: "Wash may also print on the LP, poisoning their tape.", tell: "LP complains of self-hits or zero-impact volume." }
      ],
      participants: [
        { role: "IB / affiliate", incentive: "Commission on lots, not on client PnL." },
        { role: "Rebate / cashback client", incentive: "Fee kickback > spread cost if they control both sides or a tight B-book." },
        { role: "Mule accounts", incentive: "Small payment for KYC." },
        { role: "Broker finance", incentive: "Looks like healthy volume until payouts exceed spread capture." },
        { role: "AML", incentive: "Volume can also layer illicit funds." }
      ],
      detection: {
        tools: ["Related-party graph (KYC + device + bank)", "Lot-to-PnL and lot-to-margin ratios", "IB payout vs client loss reconciliation", "Self-match / opposite-account timing", "Bonus ledger join"],
        parameters: [
          { metric: "Net inventory / gross lots", window: "Session / 7d", warn: "< 8% (almost flat)", breach: "< 3% with > 100 lots", notes: "Classic wash ratio." },
          { metric: "Round-trip time same qty opposite sign", window: "Per account pair", warn: "< 30s", breach: "< 5s repeatedly", notes: "Include opposite accounts in the same cluster." },
          { metric: "Device / funding overlap", window: "Onboarding + 90d", warn: "2 accounts", breach: "3+ accounts or IB-owned flow", notes: "Fuzzy match phones, cookies, UBO." },
          { metric: "IB payout / spread capture", window: "Month", warn: "> 40%", breach: "> 70% or IB book is net profitable vs house", notes: "Economics break." },
          { metric: "Bonus turnover then withdraw", window: "From bonus grant", warn: "Wagering met in < 48h", breach: "Met + withdraw in < 24h with flat risk", notes: "Bonus abuse." }
        ]
      },
      escalation: [
        { lvl: "L0", when: "Daily", who: "SYS", action: "Cluster lots vs net risk; IB anomaly list." },
        { lvl: "L1", when: "24h", who: "Fraud + Surveillance", action: "Confirm linkage; pause IB payouts on flagged lots." },
        { lvl: "L2", when: "Same week", who: "AML / CO", action: "Source-of-funds if fiat circularity suspected." },
        { lvl: "L3", when: "Confirmed wash", who: "Compliance", action: "Void bonus, claw back IB, file if reportable." },
        { lvl: "L4", when: "Network", who: "Risk + Legal", action: "Close cluster, ban IB, notify payment partners." },
        { lvl: "L5", when: "Laundering pattern", who: "MLRO", action: "SAR/STR." }
      ],
      countermeasures: [
        "Pay IBs on net new equity or qualified lots, not raw volume.",
        "Self-match prevention across the beneficial-owner graph, not per login.",
        "Bonus wagering that excludes related-account and sub-1-minute round trips.",
        "Device fingerprint + withdrawal lock on clustered accounts.",
        "STP: disclose and block self-hits before they reach the LP.",
        "Monthly IB forensic: top 20 IBs by lots/PnL anomaly."
      ]
    },
    {
      id: "cfd-cross-underlying",
      code: "TRN-CFD-06",
      name: "Cross-underlying and basis lean",
      severity: "high",
      products: ["spot", "margin", "perps", "futures"],
      summary: "The predator moves a cheaper or thinner underlying (cash, small future, related ETF, or offshore print) so the CFD mark, margin, or auto-hedge follows.",
      why: "Most CFD prices are derived. If the derivation is a single future, a single FX mid, or a last-trade print, the derived book can be hijacked from outside.",
      workflow: [
        { n: "01", who: "Predator", action: "Find a CFD whose mark is a thin source (small-cap CFD, single-future index, crypto CFD from one exchange, exotic FX from one LP).", tell: "Mark source count = 1 or 2; source ADV is small vs CFD OI." },
        { n: "02", who: "Predator", action: "Build the CFD or perp position that will benefit when the source ticks.", tell: "Large CFD inventory vs source volume." },
        { n: "03", who: "Predator", action: "Hit the source venue (or the hedge LP the broker uses) with aggressive clips.", tell: "Source prints a spike; CFD mid jumps 1:1." },
        { n: "04", who: "Broker engines", action: "Reprice, liquidate, or auto-hedge on the new mid.", tell: "Client liqs or house hedges fire on the spike." },
        { n: "05", who: "Predator", action: "Unwind both legs; source reverts.", tell: "Source volume is almost all the predator; CFD clients ate the mark." }
      ],
      participants: [
        { role: "Cross-venue trader", incentive: "Cheap to move source, expensive to move the derived book." },
        { role: "Broker auto-hedger", incentive: "Mechanically chases the source — can be the exit." },
        { role: "Client on margin", incentive: "Gets stopped on a print that was not a real consensus." },
        { role: "Index agent / LP", incentive: "May be the thin source." }
      ],
      detection: {
        tools: ["Mark-source inventory (which venues feed which CFD)", "Basis and z-score vs composite", "Lead-lag (source tick then CFD liq)", "External venue drop copy if available", "Kaiko/Refinitiv composite vs house mid"],
        parameters: [
          { metric: "Source concentration of the mark", window: "Static + daily", warn: "Top source weight > 70%", breach: "Single venue / last-trade only", notes: "Design flaw." },
          { metric: "CFD OI / source ADV", window: "20d", warn: "> 0.5", breach: "> 1.5", notes: "Mark can be leaned." },
          { metric: "Basis z-score vs composite", window: "1s–1m", warn: "|z| > 3", breach: "|z| > 5 for > 3s", notes: "Freeze mark, do not liq." },
          { metric: "Lead-lag: source aggressive volume → house liq", window: "Event", warn: "Liq within 1s of single-venue spike", breach: "Same account family on both source and CFD", notes: "Smoking gun." },
          { metric: "Auto-hedge slippage vs composite", window: "Per hedge", warn: "> 1.5× normal", breach: "Hedge walks a single LP after a spike", notes: "Hedge is being farmed." }
        ]
      },
      escalation: [
        { lvl: "L0", when: "Tick", who: "SYS", action: "Circuit on |z| vs composite; hold liquidations." },
        { lvl: "L1", when: "Minutes", who: "Market Risk", action: "Confirm source outage vs manipulation." },
        { lvl: "L2", when: "Same session", who: "Surveillance", action: "Trace who traded the source and who benefited on CFD." },
        { lvl: "L3", when: "Client harm", who: "CO", action: "Re-mark, restore equity if print was off-market." },
        { lvl: "L4", when: "Structural", who: "Product", action: "Change mark formula; add venues; widen." },
        { lvl: "L5", when: "Cross-venue abuse", who: "Legal", action: "Notify source venue." }
      ],
      countermeasures: [
        "Composite mids: ≥3 independent sources, median or trimmed mean, max source weight 40%.",
        "Liquidation hold if mark diverges from composite beyond a band.",
        "Do not auto-hedge 100% of a spike on the same LP that just printed it.",
        "Stale-source logic: if a venue does not update, drop it from the basket.",
        "Higher margin on CFDs whose source ADV is low.",
        "Document the mark hierarchy in the product spec — no silent last-trade marks."
      ]
    },
    {
      id: "cfd-funding-roll",
      code: "TRN-CFD-07",
      name: "Funding, swap, and roll gaming",
      severity: "high",
      products: ["margin", "perps", "futures"],
      summary: "Positions are parked into the funding, overnight swap, or futures roll window to extract a payment that does not reflect a genuine term rate.",
      why: "Perp CFDs pay funding from a mark–spot basis. Classic CFDs pay an overnight swap. Dated futures have a roll. All three are formulas that can be leaned.",
      workflow: [
        { n: "01", who: "Trader", action: "Observe the formula (premium index, interest +/-, tom-next, roll bid/offer).", tell: "Formula and window are public or reverse-engineered." },
        { n: "02", who: "Trader", action: "Build a large one-sided book just before the window, sometimes vs a hedge that does not pay the same rate.", tell: "OI share jumps in the last 10–30 minutes." },
        { n: "03", who: "Trader", action: "Nudge mark or basis so the payment flips or enlarges (small clips into a thin premium index).", tell: "Basis spikes only inside the window." },
        { n: "04", who: "Engine", action: "Pays funding/swap/roll to the parked side.", tell: "Payment is large vs. the size of the nudge." },
        { n: "05", who: "Trader", action: "Flatten immediately after the snapshot.", tell: "Inventory collapse within minutes after funding." }
      ],
      participants: [
        { role: "Funding farmer", incentive: "Collect a formula payment, not a view." },
        { role: "Broker treasury", incentive: "Swap schedule may embed a house pad." },
        { role: "Hedged pair trader", incentive: "Long CFD, short primary future — harvest the spread." },
        { role: "Retail holders", incentive: "Pay a rate they cannot see being manufactured." }
      ],
      detection: {
        tools: ["Funding-window position share", "Premium index vs multi-venue basis", "Inventory step-change detector", "Swap schedule vs market tom-next", "Roll volume vs open interest"],
        parameters: [
          { metric: "Account OI share into funding", window: "T-30m to snapshot", warn: "> 15%", breach: "> 25% or related cluster > 35%", notes: "Per symbol." },
          { metric: "Flatten speed after snapshot", window: "T+15m", warn: "> 50% of window position gone", breach: "> 80% gone", notes: "Intent to harvest, not hold." },
          { metric: "Premium vs composite basis", window: "Funding TWAP", warn: "House premium |z| > 3 vs 3-venue basis", breach: "|z| > 5", notes: "Nudge of the formula." },
          { metric: "Swap vs independent tom-next", window: "Daily", warn: "Pad > 1.5% annualised vs mid", breach: "Pad > 3% or one-way only", notes: "Conduct / disclosure, not just abuse." },
          { metric: "Roll participation", window: "Official roll", warn: "> 20%", breach: "> 35% and roll print off composite", notes: "Same as mark-the-close." }
        ]
      },
      escalation: [
        { lvl: "L0", when: "Each funding", who: "SYS", action: "Top holders + flatten-after list." },
        { lvl: "L1", when: "+1h", who: "Surveillance", action: "Confirm hedge on another venue (legit arb vs game)." },
        { lvl: "L2", when: "Repeat 3+ windows", who: "RO", action: "Cap position into window; change formula." },
        { lvl: "L3", when: "Client overcharge", who: "CO", action: "Swap disclosure and refund review." },
        { lvl: "L4", when: "Structural", who: "Product", action: "Longer TWAP, cap, clamp, or interest-rate based funding." },
        { lvl: "L5", when: "Misrepresentation of 'interbank swap'", who: "Legal", action: "Conduct case." }
      ],
      countermeasures: [
        "Clamp funding (e.g. ±0.75% per 8h) and use a multi-venue premium TWAP of 15–60 minutes.",
        "Position caps as % of OI in the last hour of the window.",
        "Swap rates from an independent tom-next source plus a disclosed pad.",
        "Charge a penalty on inventory that is opened < 30 minutes before funding and closed < 30 minutes after.",
        "Auction the roll rather than a last-look house price.",
        "Publish the exact formula and the venues in it."
      ]
    },
    {
      id: "cfd-liq-cascade",
      code: "TRN-CFD-08",
      name: "Liquidation cascade and ADL pressure",
      severity: "critical",
      products: ["margin", "perps", "futures"],
      summary: "A trader or a thin print knocks the first leveraged book through maintenance, the engine sells into a hole, the next books fail, and optional auto-deleveraging hits opposite winners.",
      why: "High leverage + mark-to-market + sequential liquidation is a known cascade. On perps, insurance funds and ADL add a second victim: the profitable other side.",
      workflow: [
        { n: "01", who: "Risk map", action: "Identify a symbol with high leverage, clustered liq prices, and thin insurance fund.", tell: "OI large vs depth; many accounts share similar liq prices." },
        { n: "02", who: "Aggressor or random shock", action: "Push mark through the first cluster (see stop-hunt and cross-underlying).", tell: "First liq batch fires." },
        { n: "03", who: "Liq engine", action: "Dumps (or bids) at market; mark moves further; next cluster fires.", tell: "Liq volume begets liq volume; depth evaporates." },
        { n: "04", who: "Insurance / ADL", action: "If the book cannot be closed, haircut the insurance fund or ADL opposite positions.", tell: "ADL ranks fire; winners are reduced." },
        { n: "05", who: "Opportunist", action: "Provide 'rescue' liquidity at extreme prices or pre-position for the bounce.", tell: "New bids appear only after forced flow." }
      ],
      participants: [
        { role: "High-leverage cohort", incentive: "Cheap beta — they are the cascade fuel." },
        { role: "Liq engine (SYS)", incentive: "Close risk fast, sometimes too fast." },
        { role: "Insurance fund / house", incentive: "Absorb residual; can be underfunded." },
        { role: "ADL victims", incentive: "Were right and still get cut." },
        { role: "Scavenger MM", incentive: "Buy the forced dump." }
      ],
      detection: {
        tools: ["Liq ladder heatmap (internal, delayed)", "Insurance fund runway", "Cascade simulator (stress_testing style)", "Mark freeze logic", "ADL rank audit"],
        parameters: [
          { metric: "OI at risk within X bps", window: "Continuous", warn: "> 15% of OI within 50 bps", breach: "> 25% within 30 bps", notes: "Pre-emptive margin." },
          { metric: "Liq-begets-liq ratio", window: "Event", warn: "2nd wave > 50% of 1st wave", breach: "3+ waves or engine walk > N ticks", notes: "Sequential market orders." },
          { metric: "Insurance fund / 1-day liq residual", window: "Daily", warn: "< 3×", breach: "< 1×", notes: "ADL likely." },
          { metric: "Mark vs composite during cascade", window: "Event", warn: "Diverges > 30 bps", breach: "Diverges > 80 bps — freeze", notes: "Do not liq on a bad mark." },
          { metric: "ADL fairness", window: "Each ADL", warn: "Rank not explained by leverage×profit", breach: "House or VIP exempt", notes: "Conduct issue." }
        ]
      },
      escalation: [
        { lvl: "L0", when: "Always", who: "SYS", action: "Live OI-at-risk; auto reduce max leverage when warn hits." },
        { lvl: "L1", when: "Cascade start", who: "Market Risk", action: "Widen, halt liq on disputed mark, switch to limits." },
        { lvl: "L2", when: "Insurance < breach", who: "CRO", action: "Capitalise fund or de-risk product." },
        { lvl: "L3", when: "ADL used", who: "CO + Product", action: "Client comms; audit ranks." },
        { lvl: "L4", when: "Client harm from bad mark", who: "Legal", action: "Restitution; product suspension." },
        { lvl: "L5", when: "Systemic", who: "Board / regulator", action: "Notify supervisor if local rules require incident report." }
      ],
      countermeasures: [
        "Liquidate with limits / staggered clips, not one market order.",
        "Mark freeze and liq hold when composite diverges.",
        "Dynamic leverage: cut max leverage as OI-at-risk rises.",
        "Size the insurance fund to stress (see existing stress_testing.py patterns).",
        "ADL only after insurance; publish the rank formula; no VIP exemptions.",
        "Partial close and margin call before full wipe where the licence allows."
      ]
    },
    {
      id: "cfd-b-book-conflict",
      code: "TRN-CFD-09",
      name: "B-book conflict, toxic-flow filter, and platform friction",
      severity: "high",
      products: ["spot", "margin", "perps"],
      summary: "The house takes the other side of clients, then uses last look, wider spreads, requotes, 'platform freeze', or delayed hedges to keep winning flow and pass losing flow to LPs.",
      why: "Hybrid A/B-book is normal. Abuse is selective friction and information use: the broker knows the client book and the faster hedge path.",
      workflow: [
        { n: "01", who: "Router", action: "Score each client (win rate, markout, news trading). Easy flow stays B-book; toxic goes A-book / LP.", tell: "Fill quality and spread differ sharply by client segment." },
        { n: "02", who: "B-book", action: "On winning-client trades, hold or widen; on losing-client trades, instant fill.", tell: "Asymmetric latency and reject by client score." },
        { n: "03", who: "Hedge desk", action: "When a B-book client is suddenly right (news), dump the risk to an LP after the move.", tell: "Hedge prints after the client fill, never before on easy flow, always after on toxic." },
        { n: "04", who: "Platform", action: "Optional: quote freeze, disconnect, or widen only for the toxic segment during news.", tell: "Outage tickets cluster on profitable clients during data prints." },
        { n: "05", who: "Finance", action: "House PnL ≈ negative of retail PnL, minus hedge cost of the toxic tail.", tell: "Transfer-of-wealth pattern in management accounts." }
      ],
      participants: [
        { role: "Hybrid book router", incentive: "Maximise warehouse edge." },
        { role: "LP (downstream)", incentive: "Receives only the toxic tail — will last-look or cut the broker." },
        { role: "Retail (easy)", incentive: "Thinks they have the same price as the pro." },
        { role: "Pro / scalper", incentive: "Gets filtered; may still be marketed 'DMA'." },
        { role: "Conduct / best ex", incentive: "Must show fair dealing and disclosure." }
      ],
      detection: {
        tools: ["Client-level TCA (hold, spread, reject, slippage)", "A/B-book flag on every fill", "Hedge lag vs client fill", "Incident tickets vs news calendar", "Segmented spread heatmaps"],
        parameters: [
          { metric: "Spread paid: toxic vs easy decile", window: "Week", warn: "Toxic pays > 1.5× easy on same symbol/session", breach: "> 2.5× without disclosed tiering", notes: "Tiering must be contractual." },
          { metric: "News-window reject / disconnect rate by segment", window: "T-1m to T+3m around prints", warn: "Toxic disconnect 3× easy", breach: "Only toxic accounts 'lose session' ", notes: "Platform integrity." },
          { metric: "Hedge lag", window: "Per B-book fill", warn: "Median lag > 2s on news, < 50ms on quiet toxic", breach: "Hedge after adverse move only", notes: "Look-ahead hedge." },
          { metric: "House PnL / client loss ratio", window: "Month", warn: "> 0.55", breach: "> 0.75 with marketing as 'agency'", notes: "Disclosure mismatch." },
          { metric: "Slippage sign", window: "Day", warn: "Positive slippage rare on B-book", breach: "Zero positive slippage over 10k fills", notes: "One-way pipe." }
        ]
      },
      escalation: [
        { lvl: "L0", when: "Daily", who: "SYS", action: "Segment TCA pack to RO and Conduct." },
        { lvl: "L1", when: "Week", who: "Best-ex committee", action: "Challenge router settings." },
        { lvl: "L2", when: "Incident", who: "Tech + CO", action: "Forensic on freezes; clock-sync logs." },
        { lvl: "L3", when: "Mis-marketing", who: "Legal", action: "Change comms; possible redress." },
        { lvl: "L4", when: "Systematic harm", who: "Board", action: "Disable B-book on that product or move to agency." },
        { lvl: "L5", when: "Supervisor interest", who: "CO", action: "Notify / respond to conduct regulator." }
      ],
      countermeasures: [
        "Disclose hybrid booking in plain language; do not advertise DMA if B-booked.",
        "Same quote path and hold-time cap for all segments in a product, or publish paid tiers.",
        "Ban news-window disconnects that are client-selective.",
        "Hedge timers: if you B-book, you own the risk for a minimum hold (e.g. 1–5s) or you are agency.",
        "Positive-slippage symmetry on market orders.",
        "Independent conduct MI: house PnL vs client, reviewed by 2nd line — not the dealing desk."
      ]
    },
    {
      id: "cfd-quote-stuff",
      code: "TRN-CFD-10",
      name: "Quote stuffing and latency games",
      severity: "elevated",
      products: ["spot", "margin", "perps", "futures"],
      summary: "A flood of add/cancel messages or oscillating quotes impairs others' ability to read the book, then a fast order takes the real liquidity.",
      why: "Less common on retail CFD GUIs, common on DMA futures, FX ECNs, and API perps. Stuffing is a latency weapon, not a directional view.",
      workflow: [
        { n: "01", who: "HFT client", action: "Find a gateway or LP that is CPU/network bound.", tell: "Message rates near venue caps." },
        { n: "02", who: "Algo", action: "Burst add/cancel or flicker quotes at high rate on one or many symbols.", tell: "Messages >> trades; book flicker; others' cancel-replace lag." },
        { n: "03", who: "Victims", action: "Slow down, pull quotes, or trade on a stale view.", tell: "MM pull; spreads widen for everyone except the stuffer." },
        { n: "04", who: "Stuffer", action: "Hit remaining firm quotes on a faster path.", tell: "Their fill rate rises exactly in the burst window." }
      ],
      participants: [
        { role: "Low-latency client", incentive: "Create a private slow-market." },
        { role: "LP / MM", incentive: "Must fade or be picked off." },
        { role: "Venue / broker gateway", incentive: "Must police message budgets." }
      ],
      detection: {
        tools: ["Message-rate monitors per session", "Cancel/add bursts", "Gateway latency inflation", "SMARTS quote-stuffing", "Per-symbol flicker metrics"],
        parameters: [
          { metric: "Msgs / second / account", window: "100ms–1s buckets", warn: "> 200 (DMA FX); tune per venue", breach: "> 500 or venue-cap hugging", notes: "Set from capacity tests." },
          { metric: "Trades / messages", window: "Burst", warn: "< 0.5%", breach: "< 0.1% with flicker", notes: "Intent not to trade." },
          { metric: "Peer latency inflation", window: "Same bucket", warn: "Gateway p99 +2×", breach: "+5× coincident with one account", notes: "Harm evidence." },
          { metric: "Flicker (mid changes with no trade)", window: "1s", warn: "> 20", breach: "> 50", notes: "Oscillation." }
        ]
      },
      escalation: [
        { lvl: "L0", when: "Real-time", who: "SYS", action: "Throttle session at warn; disconnect at breach." },
        { lvl: "L1", when: "Hour", who: "Surveillance", action: "Confirm not a runaway algo (still sanction)." },
        { lvl: "L2", when: "Repeat", who: "RO", action: "DMA suspension." },
        { lvl: "L3", when: "Venue harm", who: "CO", action: "Notify venue; MAR layering/stuffing file if applicable." },
        { lvl: "L4", when: "Runaway risk", who: "Tech", action: "Kill-switch, message fees." },
        { lvl: "L5", when: "Listed market", who: "Legal", action: "Exchange investigation support." }
      ],
      countermeasures: [
        "Hard message budgets and cancel-to-add fees.",
        "Minimum quote life on displayed quotes.",
        "Per-session CPU isolation so one client cannot stall others.",
        "Kill-switch on runaway cancel loops.",
        "Do not give retail API the same unthrottled firehose as colo DMA."
      ]
    }
  ],
  crypto: [
    {
      id: "cex-wash",
      code: "TRN-CEX-01",
      name: "Wash trading and painted volume",
      severity: "critical",
      products: ["tokens", "perps", "tokenised"],
      summary: "The same beneficial owner (or the venue itself) is both buyer and seller so that volume, ranking, and 'liquidity' look real. Price barely moves.",
      why: "Listings, market-maker contracts, CoinMarketCap/CoinGecko rank, and token-listing politics are paid in volume. Tokenised RWAs use the same trick to fake secondary liquidity.",
      workflow: [
        { n: "01", who: "Issuer / MM / venue", action: "Need volume for a rank, listing, or MM rebate tier.", tell: "Contract or KPI is volume-based." },
        { n: "02", who: "Cluster", action: "Fund several accounts (or venue treasury vs MM).", tell: "Hot wallets circle; deposits from same cluster." },
        { n: "03", who: "Bots", action: "Print tight bid/ask and trade with each other at or inside the spread, 24/7.", tell: "Volume high, price impact ≈ 0, inventory of each bot mean-reverts." },
        { n: "04", who: "Retail / aggregator", action: "Sees 'deep' market; actual exit size is tiny.", tell: "A real 50–100k clip gaps the book; painted size vanishes." },
        { n: "05", who: "Tokenised asset variant", action: "Wash the secondary pool so the RWA looks liquid for a NAV or wrapping partner.", tell: "On-chain transfers loop among few addresses; CEX prints match those loops." }
      ],
      participants: [
        { role: "Project / issuer", incentive: "Rank, listing, narrative." },
        { role: "Contract MM", incentive: "Volume rebate, or contractual 'keep 0.1% spread and $X ADV'." },
        { role: "Venue (worst case)", incentive: "Fake tape to court listings and retail." },
        { role: "Wash-as-a-service farms", incentive: "Paid in tokens." },
        { role: "Retail / lenders using the tape", incentive: "Misled about exit liquidity." }
      ],
      detection: {
        tools: ["Solidus Labs HAL wash scores", "Kaiko / Coin Metrics volume-quality", "In-house self-match and common-beneficiary engine", "On-chain clustering (Chainalysis, TRM, Nansen)", "Order-ID microstructure (spread, impact, inter-arrival)"],
        parameters: [
          { metric: "Self-match / related-match share of volume", window: "1h / 24h", warn: "> 15%", breach: "> 30% or venue-MM vs venue-treasury > 20%", notes: "Use UBO + deposit graph, not only identical UID." },
          { metric: "Kyle's lambda / impact per unit volume", window: "Day vs peers", warn: "Impact in bottom decile while ADV in top decile", breach: "Near-zero impact with top-quartile ADV", notes: "Painted tape." },
          { metric: "Inventory mean-reversion of MM accounts", window: "4h", warn: "Half-life < 10 min and net ≈ 0", breach: "Plus OTR high and no external hedge prints", notes: "Closed loop." },
          { metric: "Trade-size entropy / periodicity", window: "24h", warn: "Strong 1s or 5s periodicity", breach: "Metronome trades ±1 tick all day", notes: "Bot fingerprint." },
          { metric: "On-chain loop score (tokenised)", window: "24h", warn: "Top 5 addresses > 50% of transfers", breach: "> 75% and CEX deposits/withdrawals match", notes: "RWA fake float." }
        ]
      },
      escalation: [
        { lvl: "L0", when: "Hourly", who: "SYS", action: "Wash scoreboard per pair; hide pair from 'top volume' if warn." },
        { lvl: "L1", when: "24h", who: "Market quality", action: "MM contract review; request hedge evidence." },
        { lvl: "L2", when: "Confirmed", who: "Surveillance + Listings", action: "Delist-from-rank; claw back rebates." },
        { lvl: "L3", when: "Issuer-led", who: "Compliance", action: "Token project file; possible market-abuse report." },
        { lvl: "L4", when: "Venue-led", who: "Legal + Board", action: "Stop internal painting; external audit of volume." },
        { lvl: "L5", when: "Investor harm / listings fraud", who: "Legal", action: "Regulator, listing partners, data aggregators." }
      ],
      countermeasures: [
        "Pay MMs on quality (tight real spread + external hedge + impact), not raw ADV.",
        "Self-match prevention across the deposit-address graph.",
        "Do not sell 'volume' to aggregators you know is related-party.",
        "For tokenised assets: disclose true free float and related-party volume.",
        "Surveillance publication: quality volume vs total volume.",
        "Kill rebate tiers that invert economics (rebate > fee + spread)."
      ]
    },
    {
      id: "cex-pump",
      code: "TRN-CEX-02",
      name: "Coordinated pump, dump, and social ignition",
      severity: "critical",
      products: ["tokens"],
      summary: "A group accumulates quietly, then a timed social blast (Telegram, Discord, KOLs) ignites retail, and insiders distribute into the spike.",
      why: "Low-float tokens and newly listed alts are cheap to move. Tokenised 'meme RWAs' and wrapper tokens get the same treatment.",
      workflow: [
        { n: "01", who: "Inner ring", action: "Accumulate on CEX, DEX, and OTC. Often during listing lock or before a 'partnership' tweet.", tell: "Stealth buys, OTC desks, related wallets." },
        { n: "02", who: "Operators", action: "Seed chat rooms, bots, and paid KOLs; set a time ('pump at 18:00 UTC').", tell: "Identical copy across rooms; paid-promo wallets." },
        { n: "03", who: "Outer ring / retail", action: "FOMO market buys; slippage explodes; funding flips on the perp if it exists.", tell: "Retail UIDs, small clips, social-volume spike." },
        { n: "04", who: "Inner ring", action: "Distribute into the bid; sometimes spoof a bid wall that vanishes.", tell: "Large sells from accumulation wallets; wall cancel." },
        { n: "05", who: "Aftermath", action: "Price collapses; group rebrands the next ticker.", tell: "Same admin handles, new contract." }
      ],
      participants: [
        { role: "Inner ring / insiders", incentive: "Exit liquidity." },
        { role: "Paid KOLs / call groups", incentive: "Token or USDT payment." },
        { role: "Market maker (if complicit)", incentive: "Widen and harvest, or help paint the open." },
        { role: "Retail outer ring", incentive: "Think they are early." },
        { role: "Exchange listings / marketing", incentive: "Must not amplify known pumps." }
      ],
      detection: {
        tools: ["Social volume (LunarCrush, proprietary scrapers)", "Wallet accumulation graphs", "Listing/announcement calendar join", "Solidus pump-and-dump", "Perp funding + spot lead-lag"],
        parameters: [
          { metric: "Social mentions / unique authors", window: "1h", warn: "Mentions 5× 30d baseline with low unique-author growth", breach: "10× mentions, copy-paste ratio > 40%", notes: "Bot net." },
          { metric: "Accumulation wallet distribution in spike", window: "T0–T+60m", warn: "Top pre-pump wallets provide > 25% of sell notional", breach: "> 40%", notes: "Inner ring exit." },
          { metric: "Return then crash", window: "4h", warn: "+40% then −25%", breach: "+80% then −50% on low-float", notes: "Classic shape." },
          { metric: "KOL payment trail", window: "7d before", warn: "Token transfers to known promo clusters", breach: "Contractual invoices + timed posts", notes: "Off-platform evidence." },
          { metric: "New-user concentration", window: "Event", warn: "> 30% of buy notional from accounts < 7d old", breach: "> 50%", notes: "Outer ring." }
        ]
      },
      escalation: [
        { lvl: "L0", when: "Real-time", who: "SYS", action: "Halt-lite: widen, leverage cut, banner risk on the pair." },
        { lvl: "L1", when: "Minutes", who: "Surveillance + Trust", action: "Freeze withdrawals of inner-ring wallets if ToS allows." },
        { lvl: "L2", when: "Hours", who: "Listings", action: "Delist path; cancel marketing amplification." },
        { lvl: "L3", when: "Confirmed coordination", who: "CO / MLRO", action: "Case; preserve chats if on official channels." },
        { lvl: "L4", when: "Staff / listing leak", who: "Legal + HR", action: "Insider dealing file." },
        { lvl: "L5", when: "Retail harm at scale", who: "Legal", action: "Regulator / law enforcement, especially if fiat ramps involved." }
      ],
      countermeasures: [
        "Listing lock-ups and staged unlocks with public wallets.",
        "Cooling-off: new listings have lower leverage and withdrawal delays for large sellers.",
        "Do not let marketing retweet paid call groups.",
        "On-chain watch of insider and MM wallets as a listing covenant.",
        "Risk banners when social z-score and return trip the pump shape.",
        "ToS that allows clawback of wash/pump proceeds sitting on the venue."
      ]
    },
    {
      id: "cex-spoof",
      code: "TRN-CEX-03",
      name: "Spoofing, iceberg fade, and multi-book layering",
      severity: "high",
      products: ["tokens", "perps", "tokenised"],
      summary: "Same economic idea as CFD spoofing, plus sub-accounts, a spot book and a perp book, and a DEX pool that can be used as the 'real' side.",
      why: "Crypto books are 24/7, often thin, and users can open many UIDs. Cross-product spoof: fake bids on spot, sell the perp (or the other way).",
      workflow: [
        { n: "01", who: "Trader", action: "Open or rent several UIDs; optionally add a DEX wallet.", tell: "Shared KYC, device, or withdrawal address." },
        { n: "02", who: "Algo", action: "Layer size on the visible CEX book; hide true intent on perp, option, or DEX.", tell: "Spot depth one-sided; perp aggressive the other way." },
        { n: "03", who: "Market", action: "Retail and copy-bots lean into the wall.", tell: "Joiners; mark moves toward the fake wall." },
        { n: "04", who: "Trader", action: "Hit the real venue/product; cancel CEX layers.", tell: "Cancel cluster after cross-product fill." }
      ],
      participants: [
        { role: "Multi-account trader", incentive: "Move mark or fill without showing intent." },
        { role: "Copy-trading bots", incentive: "Follow displayed size — they get farmed." },
        { role: "Venue matching engine", incentive: "Must prevent self-trade and related spoof." }
      ],
      detection: {
        tools: ["L3 replay", "Cross-product alert (spot layer + perp aggression)", "Sub-account graph", "Eventus / Solidus spoofing", "DEX fill join (EigenPhi / internal indexer)"],
        parameters: [
          { metric: "OTR and TTC", window: "5 min", warn: "OTR > 20:1, TTC < 1s", breach: "OTR > 40:1 + opposite fill", notes: "Tune per tick size." },
          { metric: "Cross-book intent flip", window: "10s", warn: "Spot displayed size 5× and perp aggressive opposite", breach: "Plus cancel of spot after perp fill", notes: "Multi-product spoof." },
          { metric: "Related UID layering", window: "2s", warn: "2 UIDs", breach: "3+ UIDs same fingerprint", notes: "Sub-account policy." },
          { metric: "Wall never trades", window: "Episode", warn: "< 5% of wall fills", breach: "0% over ≥3 episodes / day", notes: "Intent." }
        ]
      },
      escalation: [
        { lvl: "L0", when: "Real-time", who: "SYS", action: "Alert + book snapshot." },
        { lvl: "L1", when: "30 min", who: "Surveillance", action: "Replay; related UID expand." },
        { lvl: "L2", when: "Repeat", who: "Trust", action: "API ban, reduce rate limits." },
        { lvl: "L3", when: "Mark moved / liqs", who: "CO", action: "Abuse case; consider trade bust if mark-based liqs fired." },
        { lvl: "L4", when: "VIP MM", who: "Listings + Legal", action: "MM contract breach." },
        { lvl: "L5", when: "Listed security token", who: "Legal", action: "Securities-market abuse path." }
      ],
      countermeasures: [
        "Related-account aggregation for OTR and self-match.",
        "Min resting time on size above a notional.",
        "Cross-product surveillance is mandatory if you list spot + perp.",
        "Do not show spoofable 'total depth' from accounts that also have hidden perp risk.",
        "Rate-limit cancel storms."
      ]
    },
    {
      id: "cex-oracle-mark",
      code: "TRN-CEX-04",
      name: "Oracle, index, and mark-price manipulation",
      severity: "critical",
      products: ["perps", "tokens", "tokenised"],
      summary: "Someone moves a constituent of the mark, index, or oracle so liquidations, funding, structured products, or RWA NAV follow a print that is not consensus.",
      why: "Perp mark prices, option settlements, lending LTV, and tokenised-asset NAVs are formulas. Thin constituents and short TWAPs are attack surfaces — including flash-loaned DEX prints that leak into a CEX index.",
      workflow: [
        { n: "01", who: "Attacker", action: "Read the index methodology (venues, weights, staleness, TWAP length).", tell: "Public docs or leaked weights; a small venue still has weight." },
        { n: "02", who: "Attacker", action: "Open the derivative or borrow that pays if the mark moves (perp, option, lending liquidation, NAV-based redemption).", tell: "Large perp or borrow vs thin index constituent." },
        { n: "03", who: "Attacker", action: "Print the weak constituent: wash on a small CEX, or swap a DEX pool that the oracle reads, sometimes with a flash loan.", tell: "One venue spikes; others do not." },
        { n: "04", who: "Engine", action: "Mark/NAV/LTV jumps; liqs or funding fire.", tell: "Liq cascade on a print the composite never confirmed." },
        { n: "05", who: "Attacker", action: "Unwind the print; keep derivative profit.", tell: "Constituent reverts; perp PnL remains." }
      ],
      participants: [
        { role: "Index / oracle designer", incentive: "Must assume adversarial prints." },
        { role: "Attacker with leverage", incentive: "Derivative payoff >> cost of moving the thin source." },
        { role: "Small venue / DEX pool", incentive: "May be paid or simply thin." },
        { role: "Borrowers / longs", incentive: "Liquidated on a fake mark." },
        { role: "RWA issuer (tokenised)", incentive: "NAV that used a bad secondary print." }
      ],
      detection: {
        tools: ["Composite vs constituent dashboards", "Chaos Labs / Gauntlet-style oracle monitors", "Chainlink / Pyth / RedStone deviation alerts", "Flash-loan + swap tracers (Forta, EigenPhi)", "Internal mark vs median of top-N"],
        parameters: [
          { metric: "Constituent deviation vs median", window: "1s–1m", warn: "> 30 bps (large cap) / > 80 bps (mid)", breach: "> 80 bps / > 150 bps — drop source", notes: "Hard exclude, do not just down-weight late." },
          { metric: "TWAP window vs attack duration", window: "Design", warn: "TWAP < 5 min on a venue you do not control", breach: "Last-price or 1-min TWAP on a DEX you can flash", notes: "Design breach." },
          { metric: "Flash-loan + oracle read same block / same minute", window: "On-chain", warn: "Any", breach: "Plus CEX mark move / liq", notes: "Atomic or near-atomic." },
          { metric: "Mark vs robust composite during liq", window: "Event", warn: "> 20 bps", breach: "> 50 bps — freeze liq", notes: "Same as CFD mark freeze." },
          { metric: "RWA NAV vs attestation / primary market", window: "Daily / hourly", warn: "> 50 bps", breach: "> 150 bps or stale attestation > 24h (intraday RWA) / > T+2 (fund)", notes: "Tokenised specific." }
        ]
      },
      escalation: [
        { lvl: "L0", when: "Tick", who: "SYS", action: "Drop deviant source; freeze mark; halt liq." },
        { lvl: "L1", when: "Minutes", who: "Market Risk", action: "Confirm incident vs outage." },
        { lvl: "L2", when: "Same day", who: "Surveillance", action: "Who benefited on perp/borrow/NAV?" },
        { lvl: "L3", when: "Client harm", who: "CO", action: "Bust or re-liq policy; comms." },
        { lvl: "L4", when: "Methodology hole", who: "Product", action: "Change index; remove venue; lengthen TWAP." },
        { lvl: "L5", when: "RWA / security token", who: "Legal + issuer", action: "Attestation restatement; supervisor if required." }
      ],
      countermeasures: [
        "Median of ≥5 quality venues; max weight 25–30%; instant exclusion on deviation.",
        "TWAP/EWMA long enough that a flash print cannot dominate (often 15–60 min for funding; shorter for liq but with a composite, not a single book).",
        "Never read a flash-loanable spot as a last price.",
        "For tokenised assets: NAV from primary/attested NAV, not from a thin secondary CEX print.",
        "Circuit breakers on mark velocity.",
        "Insurance / clawback if liqs fired on a later-invalidated mark."
      ]
    },
    {
      id: "cex-funding",
      code: "TRN-CEX-05",
      name: "Perp funding-rate attack",
      severity: "high",
      products: ["perps"],
      summary: "Park a dominant side of open interest and/or nudge the premium index so the funding payment is extracted from the crowded other side.",
      why: "Crypto perps pay funding every 1–8 hours. Thin alts have tiny premium windows. Combined with wash on spot, the premium is cheap to fake.",
      workflow: [
        { n: "01", who: "Farmer", action: "Choose an alt perp with low OI and a short premium TWAP.", tell: "OI vs spot ADV is awkward; formula is public." },
        { n: "02", who: "Farmer", action: "Build a large one-sided perp; optionally hedge on spot/OTC that does not pay funding.", tell: "OI share rises into the window." },
        { n: "03", who: "Farmer", action: "Paint spot or the constituent used for premium so funding flips.", tell: "Spot on one venue rips; premium spikes only in TWAP." },
        { n: "04", who: "Engine", action: "Pays funding.", tell: "Payment >> cost of paint." },
        { n: "05", who: "Farmer", action: "Flatten both legs.", tell: "OI drops after the hour." }
      ],
      participants: [
        { role: "Funding farmer / basis desk", incentive: "Harvest the formula." },
        { role: "Crowded retail side", incentive: "Pays a manufactured rate." },
        { role: "Venue", incentive: "Must cap and robustify the index." }
      ],
      detection: {
        tools: ["Funding-window OI share", "Premium vs multi-venue basis", "Spot wash join", "Flatten-after detector", "Cross-exchange funding arb dashboards (Laevitas, Coinglass — as context, not truth)"],
        parameters: [
          { metric: "OI share T-30m", window: "Each funding", warn: "> 20%", breach: "> 35% cluster", notes: "Related UIDs." },
          { metric: "Flatten T+20m", window: "After", warn: "> 50%", breach: "> 80%", notes: "Harvest." },
          { metric: "Premium vs 5-venue basis", window: "TWAP", warn: "|z| > 3", breach: "|z| > 5 or single-venue driven", notes: "Paint." },
          { metric: "Funding vs realised 8h return", window: "Week", warn: "Funding persistently one-way while price mean-reverts", breach: "Plus same cluster always on receiving side", notes: "Extraction." },
          { metric: "Clamp hits", window: "Day", warn: "Clamp frequent on one name", breach: "Clamp + same farmer", notes: "Formula still leaky." }
        ]
      },
      escalation: [
        { lvl: "L0", when: "Each window", who: "SYS", action: "Farmer list." },
        { lvl: "L1", when: "+1h", who: "Surveillance", action: "Spot-paint join." },
        { lvl: "L2", when: "Repeat", who: "Risk", action: "Cap OI share; change TWAP." },
        { lvl: "L3", when: "Client harm", who: "CO", action: "Consider funding restatement for that window." },
        { lvl: "L4", when: "Structural", who: "Product", action: "Interest-rate + clamp + longer window." },
        { lvl: "L5", when: "If token is a security", who: "Legal", action: "Abuse analysis under local law." }
      ],
      countermeasures: [
        "Multi-venue premium, 30–60 min TWAP, clamp per interval.",
        "OI share caps into the window.",
        "Penalty fee on open/close straddling only the snapshot.",
        "Do not let a washable spot venue dominate premium.",
        "Align funding with an external rate for stables (SOFR-like or lending rate) plus basis, not last price."
      ]
    },
    {
      id: "cex-liq-adl",
      code: "TRN-CEX-06",
      name: "Liquidation hunt, insurance drain, and ADL abuse",
      severity: "critical",
      products: ["perps", "tokens"],
      summary: "Push mark into a liquidation pocket, farm the engine, drain the insurance fund, or game ADL ranking (including VIP exemption).",
      why: "Crypto perps advertise 20–100×. Liquidation maps are public. Insurance funds and ADL are opaque — a privilege surface.",
      workflow: [
        { n: "01", who: "Hunter", action: "Read public liq maps and on-venue OI.", tell: "Heatmap levels; crowded leverage." },
        { n: "02", who: "Hunter", action: "Nudge mark (spot paint, spoof, aggressive clip).", tell: "First liqs fire." },
        { n: "03", who: "Engine", action: "Market-dumps into the hunter or a complicit MM.", tell: "Liq prints lift the hunter's resting liquidity." },
        { n: "04", who: "If hole remains", action: "Insurance pays; if empty, ADL hits counterparties.", tell: "Fund step-down; ADL events." },
        { n: "05", who: "Privilege path", action: "VIP / house account avoided ADL or received liq flow first.", tell: "Rank residuals unexplained." }
      ],
      participants: [
        { role: "Liq hunter", incentive: "Be the bid for forced flow." },
        { role: "High-leverage users", incentive: "Fuel." },
        { role: "Insurance fund", incentive: "Backstop — can be mis-sized." },
        { role: "ADL counterparties", incentive: "Want a fair rank." },
        { role: "VIP desk (conflict)", incentive: "Preferential matching or ADL skip." }
      ],
      detection: {
        tools: ["Internal liq ladder", "Insurance runway", "ADL rank explainer", "Mark-freeze", "VIP vs retail fill-during-liq audit"],
        parameters: [
          { metric: "OI-at-risk within 1% ", window: "Live", warn: "> 12%", breach: "> 20%", notes: "Cut leverage." },
          { metric: "Hunter fill share of liq volume", window: "Event", warn: "> 25%", breach: "> 40% one cluster", notes: "They were waiting." },
          { metric: "Insurance / 99% 1-day residual", window: "Daily stress", warn: "< 3×", breach: "< 1×", notes: "Fund the fund." },
          { metric: "ADL exemption", window: "Each ADL", warn: "Any undocumented skip", breach: "VIP/house skip", notes: "Conduct." },
          { metric: "Mark vs composite", window: "Event", warn: "> 40 bps", breach: "> 100 bps freeze", notes: "Bad mark." }
        ]
      },
      escalation: [
        { lvl: "L0", when: "Always", who: "SYS", action: "Dynamic leverage + mark freeze." },
        { lvl: "L1", when: "Hunt event", who: "Risk", action: "Stagger remaining liqs." },
        { lvl: "L2", when: "Insurance warn", who: "CRO", action: "Capital injection or de-list high leverage." },
        { lvl: "L3", when: "ADL", who: "CO", action: "Publish ranks; client comms." },
        { lvl: "L4", when: "VIP privilege", who: "Legal + CEO", action: "Remove exemption; redress." },
        { lvl: "L5", when: "Insolvency risk", who: "Board", action: "Halt product; supervisor." }
      ],
      countermeasures: [
        "Stop publishing tick-accurate liq maps.",
        "Staggered limit liqs; isolated vs cross controls.",
        "No ADL VIP exemptions; formula on the website and in the log.",
        "Size insurance to stress, not to marketing.",
        "Lower max leverage as OI-at-risk rises.",
        "Pro-rata or auction liq rather than 'whoever is fastest'."
      ]
    },
    {
      id: "cex-rwa",
      code: "TRN-CEX-07",
      name: "Tokenised-asset NAV, reserve, and attestation fraud",
      severity: "critical",
      products: ["tokenised"],
      summary: "A token that claims to be cash, T-bills, gold, funds, real estate, or wrapped BTC/ETH is unbacked, rehypothecated, marked on a stale or related-party NAV, or attested by a captured process.",
      why: "Tokenised RWAs and wrappers are balance-sheet products wearing a token. The market crime is often fraud and disclosure, then trading abuse on the secondary.",
      workflow: [
        { n: "01", who: "Issuer", action: "Mint tokens against claimed reserves (bank cash, bills, vault metal, BTC, fund shares).", tell: "Mint addresses, custodian names, attestation PDFs." },
        { n: "02", who: "Weak control", action: "Reserves are reused, lent, comingled, or never existed; or NAV is marked from a related desk.", tell: "Attestation lag, auditor shopping, proof that is balances-not-ownership." },
        { n: "03", who: "Secondary", action: "Wash the CEX/DEX book so the token 'trades at NAV'.", tell: "Related volume; tiny free float." },
        { n: "04", who: "Stress", action: "Redemptions gate; secondary depegs; lending markets that took the token as collateral cascade.", tell: "Queue, haircut, depeg." },
        { n: "05", who: "Insider", action: "Exit via the still-liquid pair or via affiliated market maker.", tell: "Insider wallets redeem or sell first." }
      ],
      participants: [
        { role: "Issuer / sponsor", incentive: "Seigniorage, AUM fees." },
        { role: "Custodian / sub-custodian", incentive: "May rehypothecate." },
        { role: "Attestor / auditor", incentive: "Narrow engagement; point-in-time PDF." },
        { role: "Authorised participant / MM", incentive: "Mint/redeem arb — or wash." },
        { role: "Lending protocol / CEX earn", incentive: "Accepts the token as cash-equivalent." },
        { role: "Holder", incentive: "Thinks they hold the asset." }
      ],
      detection: {
        tools: ["Chainlink PoR + independent wallet watch", "Bank/custodian confirmations (not screenshots)", "Mint/redeem vs reserve delta", "TRM/Chainalysis on reserve wallets", "NAV vs composite secondary", "Attestation calendar monitor"],
        parameters: [
          { metric: "On-chain supply vs attested reserve", window: "Each attestation + continuous PoR", warn: "Gap > 25 bps", breach: "Gap > 100 bps or reserve wallet movement unexplained", notes: "Include pending mints." },
          { metric: "Attestation age", window: "Continuous", warn: "> 7d for cash-like; > 30d for funds", breach: "> 30d cash-like; missing opinion; auditor resignation", notes: "Stale = untrusted." },
          { metric: "Related-party share of secondary volume", window: "7d", warn: "> 30%", breach: "> 60%", notes: "Fake NAV peg." },
          { metric: "Redemption lag vs disclosed T+", window: "Each request", warn: "Miss +1 day", breach: "Gate without disclosed trigger", notes: "Liquidity lie." },
          { metric: "Collateral use vs free reserve", window: "Daily", warn: "Token used as collateral elsewhere > disclosed", breach: "Rehypothecation > 0 when advertised 1:1 segregated", notes: "Fraud." },
          { metric: "NAV vs independent price of underlying", window: "Daily", warn: "> 30 bps unexplained", breach: "> 100 bps or always marked in issuer favour", notes: "Valuation abuse." }
        ]
      },
      escalation: [
        { lvl: "L0", when: "Continuous", who: "SYS", action: "PoR / supply delta alert; depeg alert." },
        { lvl: "L1", when: "Hours", who: "Custody + Risk", action: "Pause new listings as collateral; raise haircut." },
        { lvl: "L2", when: "Same day", who: "Listings + CO", action: "Demand raw reserve evidence; halt mint if you are the issuer venue." },
        { lvl: "L3", when: "Gap confirmed", who: "MLRO + Legal", action: "Freeze issuer/MM accounts; client comms." },
        { lvl: "L4", when: "Depeg / gate", who: "CRO", action: "Delist as margin collateral; isolate markets." },
        { lvl: "L5", when: "Missing assets", who: "Legal", action: "Regulator, law enforcement, insolvency path." }
      ],
      countermeasures: [
        "Treat tokenised cash, bills, gold, funds, and wrappers as credit products: haircut, concentration limits, and a kill-switch as collateral.",
        "Require continuous PoR plus periodic independent confirmation of ownership (not just balances).",
        "Mint/redeem only against pre-funded, segregated accounts; reconcile every mint to a reserve increment before tokens go live.",
        "Ban related-party volume from 'trades at NAV' marketing and from collateral eligibility tests.",
        "Public, machine-readable attestation calendar; auto-downgrade the token if a date is missed.",
        "If you list the token as a cash-equivalent, you own the look-through. If you cannot look through, it is a risky asset."
      ]
    },
    {
      id: "cex-insider-unlock",
      code: "TRN-CEX-08",
      name: "Insider listing, leak, and unlock dumps",
      severity: "high",
      products: ["tokens", "tokenised"],
      summary: "Staff, listing agents, or insiders accumulate before a listing, listing-tier upgrade, or token unlock, then distribute into the announcement. Unlock cliffs are the scheduled version of the same trade.",
      why: "Listings and unlock calendars are the two most predictable crypto catalysts. Information walls at exchanges are weaker than at traditional listing venues. Tokenised fund share classes have the same leak around 'going live'.",
      workflow: [
        { n: "01", who: "Insider / agent", action: "Learn of a listing, pair, seed, or unlock before the public ticker.", tell: "Ticket in listings CRM; Telegram with project; unlock JSON." },
        { n: "02", who: "Insider", action: "Buy on DEX, a smaller CEX, or OTC under other UIDs/wallets.", tell: "Wallets that later deposit to the listing venue; staff-device overlap." },
        { n: "03", who: "Venue / project", action: "Announce; book opens or unlock hits circulating supply.", tell: "Gap up; social blast." },
        { n: "04", who: "Insider", action: "Sell the news; sometimes with a spoofed bid wall.", tell: "Pre-announcement wallets are the offer." },
        { n: "05", who: "Unlock variant", action: "Team / investor wallets dump at the cliff while MM 'supports' then steps aside.", tell: "Known unlock wallets, supply shock, basis blowout on perp." }
      ],
      participants: [
        { role: "Exchange listings / BD / marketing", incentive: "Side pocket or 'friends of the desk'." },
        { role: "Project team / VCs", incentive: "Unlock liquidity." },
        { role: "OTC brokers", incentive: "See the flow and may piggyback." },
        { role: "Retail at open", incentive: "Buy the headline." },
        { role: "Compliance / surveillance", incentive: "Need personal-account dealing and wallet declarations." }
      ],
      detection: {
        tools: ["Staff PAD + wallet declaration vs chain", "Pre-announcement accumulation (Nansen, TRM)", "Unlock calendar (TokenUnlocks) joined to sell tape", "Listings CRM access logs", "Unusual profit on accounts opened < 14d before listing"],
        parameters: [
          { metric: "Pre-announcement abnormal return on related wallets", window: "T-14d to T0", warn: ">+15% vs beta", breach: ">+40% and those wallets sell T0–T+4h", notes: "Insider shape." },
          { metric: "Staff CRM access then personal trade", window: "T-30d", warn: "Any access + any personal trade in that token", breach: "Access + profitable trade without pre-clearance", notes: "PAD breach." },
          { metric: "Unlock wallet sell / unlocked amount", window: "T0–T+24h", warn: "> 20%", breach: "> 40% or stealth OTC then CEX", notes: "Scheduled dump." },
          { metric: "New UID PnL on listing day", window: "T0", warn: "Top decile PnL on accounts < 14d", breach: "Plus shared device with staff or project", notes: "Mule." },
          { metric: "Tokenised listing leak", window: "T-10d", warn: "Secondary prints before official go-live", breach: "AP/MM bought the underlying then token", notes: "Same as NAV front-run." }
        ]
      },
      escalation: [
        { lvl: "L0", when: "Each listing / unlock", who: "SYS", action: "Watchlist wallets + staff PAD match." },
        { lvl: "L1", when: "T+4h", who: "Surveillance", action: "Abnormal pre-trade pack." },
        { lvl: "L2", when: "Staff overlap", who: "CO + HR", action: "Device/forensic; suspend access." },
        { lvl: "L3", when: "Confirmed", who: "Legal", action: "Clawback, dismissal, disclosure to supervisor if required." },
        { lvl: "L4", when: "Project dump vs lock-up", who: "Listings", action: "Halt, label, or delist; sue on lock-up." },
        { lvl: "L5", when: "Security token / material retail harm", who: "Legal", action: "Regulator / LEA." }
      ],
      countermeasures: [
        "Need-to-know listings; watermarked CRM; access logs retained 5+ years.",
        "Staff wallet disclosure and pre-clearance; restricted list from first BD contact.",
        "Listing lock-ups in the contract with on-chain vesting that the venue can monitor.",
        "For unlocks: reduce leverage and raise margin T-24h to T+24h; banners on circulating supply.",
        "Cooling-off on withdrawals for team wallets after listing.",
        "Tokenised go-live: same insider list as a securities IPO wall-crossing log."
      ]
    },
    {
      id: "cex-sandwich",
      code: "TRN-CEX-09",
      name: "Cross-venue front-run, sandwich, and deposit leak",
      severity: "high",
      products: ["tokens", "perps"],
      summary: "Information about an incoming order, deposit, or OTC clip is used to trade ahead on CEX, DEX, or the perp. On-chain this is a sandwich; on CEX it is privileged look-ahead.",
      why: "Mempools are public. CEX order-routing, OTC desks, and deposit scanners are not supposed to be. Both create a look-ahead option on someone else's trade.",
      workflow: [
        { n: "01", who: "Searcher / desk", action: "See a victim: pending DEX swap, large CEX order in a slow matching path, or a fat deposit to a known hot wallet.", tell: "Mempool view, OTC blotter, deposit monitor." },
        { n: "02", who: "Searcher", action: "Buy ahead (CEX or DEX) or lift the perp.", tell: "Lead-lag: their fill precedes the victim by milliseconds to minutes." },
        { n: "03", who: "Victim", action: "Executes; price is worse; they are the meat of the sandwich.", tell: "Victim mid-point fill is through the new price." },
        { n: "04", who: "Searcher", action: "Sell back to the victim or into the improved book.", tell: "Round-trip inventory, locked-in spread." },
        { n: "05", who: "Privilege variant", action: "Venue staff or VIP API sees the order queue / deposit before matching.", tell: "Only possible with internal data — escalate as conduct." }
      ],
      participants: [
        { role: "MEV searcher / bot", incentive: "Public mempool is legal in many places; still a client-harm issue for a venue that routes on-chain." },
        { role: "OTC / brokerage desk", incentive: "Principal vs agency conflict." },
        { role: "Deposit-watcher", incentive: "CEX hot-wallet prints are a signal." },
        { role: "Privileged VIP / staff", incentive: "Illegal / ToS-breaking look-ahead." },
        { role: "Victim trader", incentive: "Worse price, sometimes liquidation." }
      ],
      detection: {
        tools: ["EigenPhi / MEV-Share style sandwich labels", "OTC blotter vs house book timestamps", "Deposit-to-trade lead-lag", "API priority / colocation audit", "Staff PAD vs queue"],
        parameters: [
          { metric: "Sandwich incidence on venue-routed DEX flow", window: "Day", warn: "> 8% of large swaps", breach: "> 20% or private-relay not offered", notes: "If you route on-chain you owe protection." },
          { metric: "OTC clip then house trade same side", window: "0–30s before client", warn: "Any without documented hedge exception", breach: "Repeat + positive house markout", notes: "Front-run." },
          { metric: "Hot-wallet deposit → aggressive CEX buy", window: "0–120s", warn: "Cluster correlation", breach: "Same beneficiary as deposit-watcher desk", notes: "Signal leak." },
          { metric: "API latency tiers vs fill quality", window: "Week", warn: "VIP markout >> retail on the same taker flow", breach: "VIP sees book/queue the retail path does not", notes: "Privilege." }
        ]
      },
      escalation: [
        { lvl: "L0", when: "Continuous", who: "SYS", action: "Sandwich and lead-lag alerts." },
        { lvl: "L1", when: "Day", who: "Execution / Surveillance", action: "Split public MEV vs internal leak." },
        { lvl: "L2", when: "Internal leak", who: "CO", action: "Kill the data path; preserve logs." },
        { lvl: "L3", when: "OTC conflict", who: "Legal", action: "Agency-only or informed-consent principal." },
        { lvl: "L4", when: "Staff / VIP", who: "Legal + HR", action: "Ban, clawback." },
        { lvl: "L5", when: "Systematic", who: "Board", action: "Supervisor; client redress." }
      ],
      countermeasures: [
        "For DEX routing: private order flow, MEV-protected relays, or RFQ; never naive public mempool sweeps for client size.",
        "OTC: timestamped blotter, no house trade on the same name until the client is done (or documented riskless principal).",
        "Delay or randomise public hot-wallet sweeps if they leak pending deposits; use many deposit addresses.",
        "Equal API market-data; paid colocation must be disclosed and not include the queue of other clients.",
        "Chinese walls: listings, OTC, and proprietary perps do not share the live client blotter."
      ]
    },
    {
      id: "cex-depeg",
      code: "TRN-CEX-10",
      name: "Stablecoin, wrapper, and tokenised-peg attack",
      severity: "critical",
      products: ["tokens", "tokenised", "perps"],
      summary: "A coordinated run, fake-news blast, or thin-book smash knocks a stablecoin or wrapped/tokenised asset off its peg so perps, lending, and basis books liquidate.",
      why: "USDT/USDC/wrapped BTC/tokenised T-bills are the collateral layer. Breaking the peg is a way to hunt every leveraged book that treated them as cash.",
      workflow: [
        { n: "01", who: "Attacker", action: "Map who is long the peg as collateral (lend, earn, cross-margin, tokenised NAV).", tell: "Public protocol stats; CEX earn TVL; RWA wrappers." },
        { n: "02", who: "Attacker", action: "Optionally short the perp or buy puts / borrow the token.", tell: "Perp OI flip; borrow rates jump." },
        { n: "03", who: "Attacker", action: "Smash a thin CEX book or a DEX pool; or seed a solvency rumour; or jam redemptions.", tell: "One venue depegs first; social spike." },
        { n: "04", who: "Cascades", action: "Oracles update, LTVs break, CEX haircuts lag, liquidations print in the depegged unit.", tell: "Bad unit-of-account liqs." },
        { n: "05", who: "Attacker", action: "Cover into forced flow or wait for the venue to halt and reprice.", tell: "Profit on short + cheap collateral grab." }
      ],
      participants: [
        { role: "Peg attacker / short", incentive: "Derivative + distressed collateral." },
        { role: "Issuer / wrapper", incentive: "Must defend or halt mint/redeem honestly." },
        { role: "CEX risk", incentive: "Haircut and pair-halt decisions in minutes." },
        { role: "Lenders / earn users", incentive: "Thought they held cash." },
        { role: "Rumour mill", incentive: "Amplifies the run." }
      ],
      detection: {
        tools: ["Peg dashboards (CEX + DEX + primary redeem)", "Issuer attestation / PoR", "Borrow-rate and perp-OI join", "Social rumour classifier", "Collateral-share of the asset across products"],
        parameters: [
          { metric: "Peg vs primary redeemability", window: "1m", warn: "Secondary −50 bps with primary still open", breach: "−150 bps or primary closed / delayed", notes: "Distinguish illiquidity from insolvency." },
          { metric: "Cross-venue dispersion", window: "30s", warn: "> 30 bps", breach: "> 80 bps — isolate the broken book from the mark", notes: "Do not let one smash become the index." },
          { metric: "Collateral share of margin equity", window: "Live", warn: "> 25% one issuer", breach: "> 40%", notes: "Concentration." },
          { metric: "Rumour + outflow", window: "1h", warn: "Social z>4 and net withdraw > 3σ", breach: "Plus insider redeem first", notes: "Run." },
          { metric: "Oracle lag vs CEX mid", window: "Event", warn: "> 60s stale", breach: "Oracle still 1.00 while CEX 0.97 — freeze liq in that unit", notes: "Wrong unit of account." }
        ]
      },
      escalation: [
        { lvl: "L0", when: "Tick", who: "SYS", action: "Peg alert; isolate smashed venue from index." },
        { lvl: "L1", when: "Minutes", who: "CRO / Market Risk", action: "Haircut, reduce leverage, pause new collateral." },
        { lvl: "L2", when: "Primary doubt", who: "Custody + CO", action: "Call issuer; halt mint/redeem pairs if you list them." },
        { lvl: "L3", when: "Client books in that unit", who: "CO", action: "Comms; do not liq on a broken dollar." },
        { lvl: "L4", when: "Insolvency suspected", who: "Legal + Board", action: "Delist as cash; convert margin to other units." },
        { lvl: "L5", when: "Systemic", who: "Board", action: "Supervisor, banking partners, public status page." }
      ],
      countermeasures: [
        "Haircut every 'cash-equivalent' token. Zero haircut is a choice, not a fact.",
        "Marks from redeemable primary + several secondaries; drop a smashed book.",
        "Pause liquidations denominated in a depegging asset until a composite is trusted.",
        "Issuer playbook: transparent redeem queue, no silent gate.",
        "Concentration limits per issuer across spot, earn, and collateral.",
        "Pre-drafted client copy for depeg events — silence is a rumour amplifier."
      ]
    }
  ],
  stack: {
    intro: "Buy tools for the tape you actually have. A CFD broker with last-look LPs does not need a DEX sandwich tracer first. A crypto venue listing tokenised T-bills does not get a free pass because SMARTS was built for cash equities. Below is a concrete stack, with the parameters each layer should own.",
    layers: [
      {
        name: "Capture and clocks",
        fit: "Both venues",
        items: [
          "Drop-copy of every order, cancel, reject, fill, quote ID, and mark — including last-look holds.",
          "PTP/NTP clock sync; target < 1 ms skew on matching, < 5 ms on market data vs orders.",
          "L3 book snapshots on every alert (at least ±5 seconds at 100ms resolution, denser on DMA).",
          "Immutable object store (WORM) for 5–7 years or local licence minimum."
        ]
      },
      {
        name: "CFD / FX / futures surveillance",
        fit: "CFD broker",
        items: [
          "Nasdaq SMARTS or Eventus Validus for spoofing, layering, marking the close, momentum ignition.",
          "NICE Actimize MAR pack if you are in a European-style abuse regime.",
          "BestX / Tradefeedr / LiquidMetrix for last-look hold, reject symmetry, LP scorecards.",
          "kdb+ / OneTick / QuestDB for bespoke replay — your hybrid A/B-book flags will never be in a vendor model out of the box.",
          "TT Score if you have professional futures DMA."
        ]
      },
      {
        name: "Crypto market abuse",
        fit: "Crypto exchange",
        items: [
          "Solidus Labs HAL (wash, spoof, pump) as a starting scorer — always retune thresholds on your own tape.",
          "Eventus or SMARTS Crypto if you want one vendor across CFD affiliate + exchange.",
          "Kaiko / Coin Metrics / Amberdata for quality-volume and cross-venue marks.",
          "Laevitas or equivalent only as context for funding and options — never as a mark source."
        ]
      },
      {
        name: "Wallet, issuer, and tokenised look-through",
        fit: "Tokens + tokenised assets",
        items: [
          "Chainalysis, TRM Labs, or Elliptic for deposit clustering, sanctions, and issuer wallets.",
          "Nansen / Arkham-class labels for accumulation and unlock wallets (use as leads, not evidence).",
          "Chainlink PoR plus your own indexer — never a screenshot of a dashboard.",
          "Forta / EigenPhi / Flashbots-class tracers if you touch DEX routing or oracles."
        ]
      },
      {
        name: "Identity graph",
        fit: "Both",
        items: [
          "Neo4j or equivalent: device, IP/ASN, cookie, bank UBO, deposit address, IB, staff UID.",
          "Self-match and OTR must run on the cluster, not the login.",
          "IB and MM legal entities get the same graph as retail mules."
        ]
      },
      {
        name: "Risk engines you already started",
        fit: "This repository",
        items: [
          "risk_metrics_monitor.py — add abuse metrics (OTR, reject symmetry, OI share) next to VaR and HHI.",
          "stress_testing.py — liquidation cascade and insurance-fund runway.",
          "trader_rights_workflow.py — do not raise leverage on a UID that is in a live surveillance case.",
          "eod_reconciliation.py — catch wash and booking breaks that the real-time tape misses."
        ]
      }
    ]
  },
  escalationHub: {
    intro: "One ladder, two flavours. Times are service levels for a 24/7 desk. If you are retail-hours only, your first failure mode is an unattended L0 over the weekend.",
    steps: [
      { lvl: "L0", title: "Detect", sla: "Real-time to 5 min", owner: "SYS / on-call RO", cfd: "Alert, snapshot book, tag last-look and A/B-book flags, halt automated liq if mark z-score breaches.", crypto: "Alert, snapshot, drop deviant index source, optional pair 'caution' banner, halt liq on broken mark." },
      { lvl: "L1", title: "Triage", sla: "15–30 min", owner: "Surveillance analyst", cfd: "News/econ filter, replay, score false-positive. If last-look, pull hold-time pack.", crypto: "Social + unlock + wallet expand. Split public MEV from internal leak." },
      { lvl: "L2", title: "Investigate", sla: "Same session to T+1", owner: "Senior surveillance + Market Risk", cfd: "Related accounts, IB, house-conflict test, LP notification draft.", crypto: "Related UIDs + chain cluster, MM contract, listings CRM access." },
      { lvl: "L3", title: "Case", sla: "T+1 to T+5", owner: "Compliance / MLRO", cfd: "MAR/CFTC/ASIC-style file, voice/chat, best-ex implications, client harm estimate.", crypto: "ToS + local abuse/fraud file, issuer letters, aggregator volume restatement." },
      { lvl: "L4", title: "Contain", sla: "Immediate once material", owner: "Head of Risk + Legal + Product", cfd: "DMA kill-switch, clip caps, disable last-look, re-mark, redress.", crypto: "API ban, pair halt, collateral haircut, insurance top-up, ADL audit, lock-up enforcement." },
      { lvl: "L5", title: "Report", sla: "As required — do not wait for a perfect file", owner: "Legal / MLRO / Board", cfd: "Venue, FCA/ASIC/MAS/CFTC/other, payment partners if IB fraud.", crypto: "Same plus chain-analytics SAR, issuer supervisor, banking partners on depeg." }
    ],
    comms: [
      "Write the client sentence before you halt: what you saw, what you paused, what happens to orders and margin.",
      "House book and marketing do not speak until CO signs the sentence.",
      "Preserve first: drop copies, marks, CRM access, wallet lists. Then talk to the issuer or LP.",
      "If you bust trades, use a published policy (off-market band + process), not a VIP phone call."
    ]
  }
};
