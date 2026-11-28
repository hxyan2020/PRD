# Permanent cron inventory (VE + Quote)

Do **not** stop any of these unless Yan explicitly says so.

## Hosts

| Bot | Host |
|-----|------|
| VE AI风控助手 | `https://vex-llm-proxy.vercel.app` |
| 报价 AI风控小助手 | `https://quote-ai-troubleshooting-bot.vercel.app` |

## Jobs (droplet + Vercel)

| Schedule (UTC) | Path | VE | Quote | Droplet mode |
|----------------|------|----|-------|--------------|
| `*/5 * * * *` | `/api/lark/cron-tick` | ✅ fan-out | ✅ fan-out | `tick` |
| `*/5` (via tick) | osc `?ping=1` | ✅ | ✅ | `tick` / `ping` |
| `3,33 * * * *` | `/api/lark/cron-health` | ✅ | ✅ | `health` |
| `*/10 * * * *` | `/api/lark/oscillation-alert` | ✅ | ✅ | `oscillation-alert` |
| `*/15 * * * *` | `/api/lark/weekly-demo` | ✅ | ✅ | `weekly-demo` |
| `*/30 * * * *` | `/api/lark/market-report` | handler disabled for Yan half-hour DM | ✅ | `market-report` |
| `* * * * *` | `/api/lark/alert-nudge` | ✅ | ✅ | `alert-nudge` |
| `0 1 * * *` | `/api/lark/daily-market-report` | ✅ | ✅ | `daily-market-report` |
| `0 10 * * *` | `/api/lark/token-usage-report` | ✅ | ✅ | `token-usage-report` |
| `0 8 * * 5` | `/api/lark/weekly-report` | ✅ group+Yan | ✅ | `weekly-report` |

`cron-tick` already fans out to health + osc + weekly-demo + daily + weekly + token + alert-nudge (+ quote market-report). Direct schedules are **backups** so a single missed tick cannot silence a job.

## Never-stop policy

1. `/etc/cron.d/lark-bot-heartbeat` + systemd `lark-bot-tick.timer` / `lark-bot-health.timer` stay enabled across reboot.
2. Uninstall refuses unless `CONFIRM_STOP=yan-said-so`.
3. Cursor agent quiet timers are only removed **after** droplet install is verified — never the other way around.
4. Vercel `vercel.json` crons must stay complete (weekly, daily, token, health×2, nudge, tick, osc, weekly-demo).
