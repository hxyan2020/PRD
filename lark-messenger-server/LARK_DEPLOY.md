# Lark parallel desk — what you need to deploy

This is the **parallel Lark channel** for V Exchange Risk Tool (beside the web desk at `xauusd-source-monitor/`).

Goal once live:

1. **Collect alarms automatically**
2. **Trigger analysis automatically**
3. **Answer follow-up questions automatically**
4. **Collect logs for realtime stats / analysis automatically**

---

## A. Lark / Feishu console (tenant)

| Item | Why |
| --- | --- |
| **Lark custom app** (or enterprise bot) | Host for event subscription + interactive cards |
| **Bot capability** enabled | Post cards into group / DM |
| **Group chat** e.g. `#risk-ops-xauusd` | Ops channel for alerts + RCA |
| **Add bot to the group** | Delivery target |
| **Incoming webhook URL** (`LARK_WEBHOOK_URL`) | Simple push path for cards (alarms / RCA / digest) |
| **Event subscription** → `POST https://<host>/api/lark/events` | Card button callbacks + IM follow-ups |
| **Verification Token** (`LARK_VERIFICATION_TOKEN`) | Validate Lark → server callbacks |
| **Encrypt Key** (`LARK_ENCRYPT_KEY`) | If event encrypt mode is on |
| **Permissions** | `im:message`, `im:message.group_at_msg`, `im:chat`, card interaction / callback |
| **(Prod) App ID + App Secret** | For reply-in-thread via OpenAPI (beyond webhook-only) |
| **(Prod) Message card request URL** | Same `/api/lark/events` for button actions |

Optional later: multi-language bot replies (EN / 繁中) using the same templates the web desk uses.

---

## B. Hosting / runtime

| Item | Why |
| --- | --- |
| **HTTPS public URL** for `lark-messenger-server` | Lark cannot call localhost |
| **Node 20+** process (`npm start`) | This repo’s server |
| **Process supervisor** (systemd / Docker / Fly / Railway / Render / Vercel serverless adapter) | Keep bot online |
| **Env secrets** (not in git) | See table below |
| **Durable store** (Postgres / Redis) | Replace `.data/events.json` for multi-instance + retention |
| **Cron / scheduler** | Optional `POST /api/stats/digest` every N hours |

### Environment variables

| Variable | Required for | Notes |
| --- | --- | --- |
| `OPENAI_API_KEY` | Auto RCA quality + follow-ups | Falls back to local rules if missing |
| `LARK_WEBHOOK_URL` | Push cards to group | Without it, APIs dry-run (payload only) |
| `LARK_VERIFICATION_TOKEN` | Event callback auth | From Lark developer console |
| `LARK_ENCRYPT_KEY` | Encrypted events | Only if enabled in console |
| `LARK_AUTO_ANALYZE` | Auto RCA after alarm | Default on; set `0` to disable |
| `DESK_BASE_URL` | Deep links on cards | Default GitHub Pages desk |
| `PORT` | Listen port | Default `8790` |
| `DESK_GATEWAY_TOKEN` | If you front the same proxy as Vercel desk | Optional shared auth |

---

## C. Alarm collection (automatic)

Wire **any** of these producers → `POST /api/alarms/ingest`:

| Producer | What to send |
| --- | --- |
| **Market Condition monitor** (`useMonitor` / stress rules) | title, severity, breached sources, trigger, summary, citation URLs |
| **V Exchange Admin** alert pages (spread / depth / funding / liq) | existing Lark URL fields → point at ingest or keep webhook + dual-write |
| **External monitors** (Datadog / Grafana / Pager) | webhook adapter → ingest JSON |
| **Manual / API** | `curl` to `/api/alarms/ingest` for drills |

Ingest **always** logs `alarm_ingested`. If `LARK_AUTO_ANALYZE` is on, it also runs RCA and posts the RCA card.

---

## D. Auto analysis

| Piece | Role |
| --- | --- |
| `POST /api/alarms/ingest` with `autoAnalyze: true` | Default path |
| `POST /api/rca/run` | Manual / card **Run RCA** |
| Card action `run_rca` via `/api/lark/events` | Operator-triggered from alert card |
| `OPENAI_API_KEY` | LLM enhancement; else deterministic rules |
| Skills + knowledge (web desk) | Longer-term: call same Investigate pipeline / shared DB |

RCA card includes: severity, investigation path, **direct source links**, recommendations (approval required).

---

## E. Auto follow-ups

| Piece | Role |
| --- | --- |
| Lark **IM / thread reply** → `/api/lark/events` | Detect question text |
| `POST /api/followup` | API / playground path |
| Incident context from store | Answers grounded on last RCA |
| Log kind `followup` | Feeds realtime stats |

Honesty rules match the web desk: no invented admin DB answers (Phase 2).

---

## F. Realtime stats + analysis logs (automatic)

Every pipeline step appends to the event log:

| Event kind | When |
| --- | --- |
| `alarm_ingested` | Alarm collected |
| `rca_created` / `rca_sent` | Analysis finished / card posted |
| `followup` | User question answered |
| `alarm_acked` / `alarm_escalated` | Card actions |
| `rca_archived` | Weekly-opt gate |
| `stats_digest_sent` | Digest posted |

APIs:

- `GET /api/stats/summary` — counters for desk / Lark digest  
- `POST /api/stats/digest` — push stats card to Lark  
- `GET /api/recent` — raw alarms / incidents / follow-ups / logs  

Mirror these into the web **Realtime Statistics** page (shared DB) when you harden production.

---

## G. Checklist (ship order)

1. Create Lark app + bot; create `#risk-ops-xauusd`; add bot.  
2. Copy **webhook URL** → `LARK_WEBHOOK_URL`.  
3. Deploy `lark-messenger-server` with HTTPS + `OPENAI_API_KEY`.  
4. Set event subscription Request URL to `/api/lark/events`; save verification token.  
5. Smoke: playground **Run full demo flow** (or `npm test`).  
6. Point Market Condition / Admin alerts at `/api/alarms/ingest`.  
7. Schedule stats digest; wire durable DB; optionally sync to web Stats.  

---

## Local preview

```bash
cd lark-messenger-server
npm start
# open http://127.0.0.1:8790/
# click “Run full demo flow”
```
