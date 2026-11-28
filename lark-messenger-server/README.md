# Lark Messenger Server — parallel V Exchange Risk desk

Lark / Feishu channel that mirrors the web **V Exchange Risk Tool**:

- Collect alarms automatically  
- Trigger RCA automatically  
- Answer follow-up questions automatically  
- Log everything for realtime stats  

Web desk (unchanged): `../xauusd-source-monitor/`  
Deploy checklist: **[LARK_DEPLOY.md](./LARK_DEPLOY.md)**

## Quick start

```bash
cd lark-messenger-server
# optional: OPENAI_API_KEY + LARK_WEBHOOK_URL in .env
npm start
# → http://127.0.0.1:8790/   (Lark-style chat UI)
```

Smoke:

```bash
npm test
```

## API

| Endpoint | Purpose |
| --- | --- |
| `GET /` | Lark message UI playground |
| `GET /health` | Status |
| `GET /api/templates` | Card templates |
| `POST /api/lark/render` | Build card JSON |
| `POST /api/lark/send` | Render + webhook (or dry-run) |
| `POST /api/alarms/ingest` | **Collect alarm** → alert card → optional auto RCA |
| `POST /api/rca/run` | **Trigger analysis** |
| `POST /api/followup` | **Answer follow-up** |
| `POST /api/lark/events` | Lark URL verification + card/IM callbacks |
| `GET /api/stats/summary` | **Realtime counters** |
| `POST /api/stats/digest` | Push stats card to Lark |
| `GET /api/recent` | Recent alarms / RCAs / follow-ups / logs |
| `POST /api/chat` | OpenAI / Gemini / OpenRouter proxy |

## Templates

- `risk-alert` — alarm card (Ack · Escalate · Run RCA · Open desk)  
- `rca-report` — path, sources, recommendations  
- `market-briefing` — Market Condition card  
- `follow-up` — thread Q&A reply  
- `stats-digest` — realtime stats  

## Env

See [LARK_DEPLOY.md](./LARK_DEPLOY.md). Minimal local:

| Variable | Notes |
| --- | --- |
| `OPENAI_API_KEY` | Better RCA + follow-ups (rules fallback if absent) |
| `LARK_WEBHOOK_URL` | Live send; otherwise dry-run |
| `LARK_AUTO_ANALYZE` | Default on (`0` to disable) |
| `DESK_BASE_URL` | Deep links to the web desk |

`.data/` holds the local event store (gitignored). Replace with Postgres in production.
