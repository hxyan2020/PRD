# V Exchange Risk Copilot — Lark bot

The **web desk stays live** (`/#/investigate`, Market, Skills, KB, Stats).  
This adds a parallel **Lark / Feishu** interaction surface on the same Vercel project.

Public host: `https://quote-ai-troubleshooting-bot.vercel.app`  
Webhook: `https://quote-ai-troubleshooting-bot.vercel.app/api/lark/event`

## Minimum to enable live conversation

You only need to provide **two secrets** (never paste into chat/PR):

| Secret | Where |
|--------|--------|
| `LARK_APP_ID` | Vercel project **`vex-llm-proxy`** → Settings → Environment Variables → Production |
| `LARK_APP_SECRET` | same |

Then in **Lark / Feishu Developer Console** (required — without this, DMs stay silent):

1. Enable **Bot** capability.
2. **Event Subscription** mode = **将事件发送至开发者服务器 / Send to developer’s server**  
   (**Do not** use 长连接 / long connection — Vercel cannot receive that.)
3. Event Request URL → `https://quote-ai-troubleshooting-bot.vercel.app/api/lark/event` → **Save** and pass URL verification.
4. Subscribe: `im.message.receive_v1`, `card.action.trigger`.
5. **Card Request URL（消息卡片请求网址）** → same host, either  
   `https://quote-ai-troubleshooting-bot.vercel.app/api/lark/event` **or**  
   `https://quote-ai-troubleshooting-bot.vercel.app/api/lark/card`  
   → Save / verify.  
   If this is empty, Feishu shows **“Card callback isn't configured”** when tapping buttons.  
   Investigation cards ship **callback buttons** (`已完成此步` / `生成排查报告` / `结束归档` / `复盘清单`); text commands remain as fallback.
6. Permissions: `im:message` / send-as-bot; image resources if you want OCR.
7. **Leave Encrypt Key OFF / empty**.
8. Verification Token: optional.
9. **Publish** the app version → open DM → send `Hi`.

Check readiness:

```bash
curl -sS https://quote-ai-troubleshooting-bot.vercel.app/api/lark/event
# want: readyForConversation=true AND eventsDelivered=true after you message the bot
```

If `eventsDelivered` stays `false` after messaging, the Request URL is still wrong or long-connection mode is selected.

`OPENAI_API_KEY` is already on the host (`hasOpenAI: true`) — better answers + image OCR. Rules/RAG still work without it.

## Optional env (not required for first conversation)

| Name | When needed |
|------|-------------|
| `LARK_VERIFICATION_TOKEN` | If you set a Verification Token in the Lark console |
| `LARK_BOT_OPEN_ID` | Rare — auto-fetched after ID/secret work; only set if @ matching misfires |
| `LARK_API_HOST` | International Lark: `https://open.larksuite.com` (default is `https://open.feishu.cn`) |
| `LARK_REPLY_ALL_GROUP=1` | Reply to every group message without @ (not recommended) |

**Group (many participants) behaviour:**
- **Alert posts** (monitoring card / alert paste, including from other apps) → captured and **investigation starts automatically** (no `@` needed).
- **Other chat** → ignored unless someone **@ the bot**.
- The group shares one investigation session so later `@bot` replies continue the same case.
| `LARK_ENCRYPT_KEY` | **Do not use** until decrypt is implemented — keep Encrypt Key off |
| `DESK_GATEWAY_TOKEN` | Protects desk smoke `/api/lark/incidents` only; unrelated to Lark chat |
| `LARK_ADMIN_OPEN_ID` | **Required for weekly + oscillation DM fallback** — Yan Haixiang’s Feishu `open_id` |
| `LARK_ADMIN_EMAIL` | Optional fallback to resolve open_id via Contact API |
| `CRON_SECRET` | Optional; Vercel Cron Authorization bearer for cron routes |

## Cron reliability (must-read)

Vercel Cron invokes the **deployment hostname**
(`*.vercel.app` deployment URL), **not** the production alias
`quote-ai-troubleshooting-bot.vercel.app`.

If **Vercel Authentication (SSO)** is set to `all_except_custom_domains`
(or `all`), those deployment URLs return **302 → vercel.com/sso-api** and
**every cron silently misses** (no function logs). Fix:

1. Project → Settings → Deployment Protection → Vercel Authentication →
   **Preview only** (or Off). Production alias stays public either way.
2. Confirm with:
   `curl -sI -H 'x-vercel-cron: 1' "https://<deployment-host>/api/lark/alert-nudge"`
   → expect **200**, not 302 SSO.
3. Backup: `.github/workflows/lark-cron-backup.yml` hits the **public alias**
   every 15 minutes so pushes still land if SSO is flipped back.

Demo catch-up windows (idempotent via durable sent-day state):

- Oscillation DEMO: after `10:00` CST until `18:00` on campaign day
- Weekly DEMO: after `16:00` CST until `18:00` on campaign day
- Daily morning: after `09:00` CST until end of day (dayKey sent-state)

**cron-tick** (`*/5 * * * *`) is the permanent keep-alive for every Lark push
job on the public alias (`quote-ai-troubleshooting-bot.vercel.app`):
1. Awaits **cron-health** first (cannot be starved by OKX / market).
2. Fans out the other jobs in parallel (per-child timeout).
3. **Watchdog pass** — any path that returned non-200 or still has a stale beat
   is retried (health with `?force=1`; others idempotent without force so cards
   cannot double-push after a late success).
4. Tick fails closed unless every path ends HTTP 200.

Each handler also writes its own durable heartbeat on invoke / skip / send, and
sent-state Blob write failures return 502 so the next tick retries.
**cron-health** itself re-sends after **35 minutes** of DM silence (including
never-sent).

## Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET/POST | `/api/lark/event` | Webhook (challenge + messages + card actions) |
| GET/POST | `/api/lark/card` | Alias for **Card Request URL** (same handler) |
| GET/POST | `/api/lark/incidents` | List / simulate turns (smoke) |
| GET/POST | `/api/lark/weekly-report` | Weekly digest (cron Fridays 16:00 CST → Yan); `?dry=1` preview |
| GET/POST | `/api/lark/market-report` | Half-hourly market DM (`*/30`); also via cron-tick |
| GET/POST | `/api/lark/daily-market-report` | Daily 09:00 CST 24h digest → group; `?dry=1` preview |
| GET/POST | `/api/lark/oscillation-alert` | Oscillation / funding / news alert → group + Yan DM |
| GET/POST | `/api/lark/cron-tick` | Every 5 min fan-out of all push jobs on public alias |
| GET/POST | `/api/lark/cron-health` | Every 30 min health DM to Yan; red @raise on missed schedule |

## Weekly report (Yan Haixiang)

- **Schedule:** every **Friday 16:00 Asia/Shanghai** (Vercel cron `0 8 * * 5` UTC)
- **Content:** this week’s handled incidents + aggregated recommendations / Skills
- **Delivery:** Feishu DM card to `LARK_ADMIN_OPEN_ID` (Yan Haixiang)
- **On-demand:** send `weekly` / `周报` in chat
- **Preview:** `curl -sS 'https://quote-ai-troubleshooting-bot.vercel.app/api/lark/weekly-report?dry=1' -H "X-Desk-Token: $DESK_GATEWAY_TOKEN"`
- **Force send:** `POST /api/lark/weekly-report` with `{ "force": true }` + desk token

## Market report (half-hourly DM)

- **Cron:** every **30 min** (`*/30 * * * *`) → Yan Haixiang DM (`LARK_MARKET_CHAT_ID`)
- **Not** listed in greeting / capabilities — private desk push only
- Chat `行情` / `market` still works on demand
- **Preview / force:** `GET ?dry=1` · `POST { "force": true }` + desk token / cron header

## Daily 24h market morning report (group)

- **Schedule:** every day **09:00 Asia/Shanghai** (Vercel cron `0 1 * * *` UTC)
- **Content:** past-24h Binance XAUUSDT 1H range (OKX backup) + TL;DR / Opportunity / Risk; language follows chat (简体 ≠ 繁體 ≠ en)
- **Sources:** favicon **logo buttons** (`multi_url`) after TL;DR / Opp / Risk points — open exchange K-line / news / social UIs (Binance/OKX/Bitget, Kitco, Yahoo, Fed, X). JSON APIs are probe-only and never shown as report links.
- **Catch-up:** cron-tick after 09:00 CST if the :00 UTC fire was missed (idempotent dayKey)
- **Delivery:** Feishu group `LARK_DAILY_MARKET_CHAT_ID` (default `oc_eb8eba24ff99a2c3ea3c9439750d65cd`)
- **Preview:** `curl -sS 'https://quote-ai-troubleshooting-bot.vercel.app/api/lark/daily-market-report?dry=1' -H "X-Desk-Token: $DESK_GATEWAY_TOKEN"`
- **Force send:** `POST /api/lark/daily-market-report` with `{ "force": true }` + desk token / cron header

## Weekly review DEMO (group)

- **Once:** **2026-11-25 16:00** Asia/Shanghai → group `oc_eb8eba24…`（【DEMO】每周复盘）
- **Cron:** `*/15 * * * *` → `/api/lark/weekly-demo`（demo 日 16:00 起至 18:00 补发，已发送则跳过）
- **Preview / force:** `GET ?dry=1` · `POST { "force": true }`
- Regular Friday 16:00 weekly still goes to Yan via `/api/lark/weekly-report`

## Oscillation alert (vol / leverage / news)

- **Cron:** every **15 min** (`*/15 * * * *`) → `/api/lark/oscillation-alert`
- **Triggers:** Binance XAUUSDT (OKX backup) short-horizon amplitude ≫ dynamic mean, **or** |funding| ≫ historical mean (leverage crowding proxy), **or** breaking news keywords
- **Delivery:** Feishu **group** + **Haixiang DM** (chat_id, open_id fallback); short 简体 card + sources + 连锁强平风险提示
- **Demo:** **2026-11-25 10:00** Asia/Shanghai once (`LARK_OSC_DEMO_DAY` / `LARK_OSC_DEMO_START`); catch-up until 18:00 CST if the :00 cron is skipped
- **Preview / force:** `GET ?dry=1` · `POST { "force": true, "demo": true }`

## Alert nudge (tomorrow-only group @mention loop)

- **Campaign day only:** **2026-11-25** Asia/Shanghai (override `LARK_ALERT_NUDGE_DAY`)
- **Start:** **08:30** CST; every ~1 min until **知道了** (or 18:00 safety stop)
- **Cron:** `* * * * *` → `/api/lark/alert-nudge` (no-op on other days)
- **Message:** @Haixiang +「新告警来啦 快来看看」
- **Chat:** `LARK_ALERT_NUDGE_CHAT_ID` / `LARK_DAILY_MARKET_CHAT_ID` (default `oc_eb8eba24…`)
- **Preview / force:** `GET ?dry=1` · `POST { "force": true }`
- Set `LARK_ADMIN_OPEN_ID` for a real @mention; text「知道了」also stops the loop

## Bot behaviour

1. **Greeting** — natural hello on @mention / hi / 你好 (SGT time-of-day).
2. **Market Q&A** — OKX + desk links.
3. **Off-topic / safety** — gentle reject; no PII, cursing, or political topics.
4. **Investigate** — alerts/text/image/table; adaptive steps; emoji + bold bullets; AIPO evidence grades (Confirmed / Suspected / Unknown + [OBS]/[DESIGN]/…).
5. **RAG + Skills** — desk + quote-ops V Exchange perpetual (`v-exchange-perp`; CFD excluded).
6. **Dashboard** — `review` / `dashboard` → KPI card + https://quote-ai-troubleshooting-bot.vercel.app/#/reports
7. **Wiki / Docs (AIPO)** — read-only Lark Wiki search + Docx excerpt when scopes allow; otherwise show setup steps / @Yan.

Commands: `help` · `market` · `investigate` · `review` · `dashboard` · `wiki` · `knowledge` / `kb` · `weekly` / `周报` · `done` / `archive`

### Wiki / Docs setup (bot = tenant_access_token)

`wiki/v2/nodes/search` is **user_access_token only** (error 99991663 with app token). Production path:

1. App scopes (publish after enabling): `search:docs:read`, Wiki read, Docx/Docs read.
2. Grant **resource** access: add a group that includes this bot as Wiki space **read** member, or add the app as a doc collaborator (“添加文档应用”).
3. Optional env: `LARK_WIKI_SPACE_IDS` (comma-separated) to pin search spaces.
4. APIs used: `GET /wiki/v2/spaces`, `POST /search/v2/doc_wiki/search`, `GET /wiki/v2/spaces/get_node`, `GET /docx/v1/documents/:id/raw_content`.

## AIPO Lark API UAT (OWNLAB「Lark API 接入需求」)

| Acceptance | Prod status |
|------------|-------------|
| Read authorized Wiki / Docs | Implemented via tenant-capable search/v2 + wiki get_node; needs scopes + Wiki membership |
| Read authorized group messages | Live events + best-effort history on group investigate |
| DM / @Bot bidirectional chat | Done |
| Active push to user/group | Done (alerts + Fri 16:00 CST weekly DM) |
| Interactive cards + callback | Done |
| Unauthorized data/groups blocked | Done (access gate → @Yan; min scopes) |
| Auditable ops / credential hygiene | Inbound + investigate/wiki audit log; secrets on Vercel only |

Source: OWNLAB notebook «Lark api 调用需求文档» (RC AI Agent × Lark Integration). Later polish (daypart, weekly, FAQ, greeting footer) is preserved.

## Smoke without Lark credentials

```bash
curl -sS -X POST https://quote-ai-troubleshooting-bot.vercel.app/api/lark/incidents \
  -H 'Content-Type: application/json' \
  -d '{"text":"investigate IDX-01 excluded, Mark 48bps"}'
```

(May return `Unauthorized` if `DESK_GATEWAY_TOKEN` is set on the host.)

## Security

- Never paste App Secret into chat or git.
- Preferred Actions always need human approval — the bot never claims production execution.
