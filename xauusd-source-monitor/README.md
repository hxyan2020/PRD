# XAUUSD Source Monitor (V Exchange)

Public monitor for **XAUUSD MVP perpetual** price sources (exchanges + liquidity providers).

## Permanent link

https://hxyan2020.github.io/PRD/xauusd-source-monitor/

## What it does

1. **Health** — live source table, composite median, health scores, live vs derived feed mode  
2. **Rules** — documented multi-source trigger policy + tunable thresholds  
3. **Briefings** — timestamped archive of auto investigations (why / V Exchange impact / safeguards)

### Default trigger policy

- Watch at **8 bps**, Alert at **15 bps** vs composite median  
- Fire when **≥3 sources** are in Alert  
- Or **≥2 exchange** + **≥1 LP** at Watch/Alert  
- Or composite moves **≥35 bps** in 5 minutes  
- **10 minute** briefing cooldown (Critical escalations bypass)

### Live anchors

- OKX `XAU-USDT-SWAP`  
- Bitget `XAUUSDT` (when reachable)  
- gold-api XAU spot (`RC_INDEX` / LMAX-style)

Other venues (BINANCE, BYBIT, indexes, ISPRIME, STARPRIME, VELOCITY) use correlated derived mirrors when browser CORS/geo blocks direct pulls.

## Local

```bash
npm install
npm run dev
GITHUB_PAGES=1 npm run build
bash scripts/deploy-gh-pages.sh
```
