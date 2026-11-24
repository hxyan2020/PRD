# V Exchange Risk Copilot — Lark bot

The **web desk stays live** (`/#/investigate`, Market, Skills, KB, Stats).  
This adds a parallel **Lark / Feishu** interaction surface on the same Vercel project.

Public host: `https://vex-llm-proxy.vercel.app`  
Webhook: `https://vex-llm-proxy.vercel.app/api/lark/event`

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
3. Event Request URL → `https://vex-llm-proxy.vercel.app/api/lark/event` → **Save** and pass URL verification.
4. Subscribe: `im.message.receive_v1`, `card.action.trigger`.
5. **Card Request URL（消息卡片请求网址）** → same host, either  
   `https://vex-llm-proxy.vercel.app/api/lark/event` **or**  
   `https://vex-llm-proxy.vercel.app/api/lark/card`  
   → Save / verify.  
   If this is empty, Feishu shows **“Card callback isn't configured”** when tapping buttons.  
   Investigation cards default to **text commands** (`step done` / `done` / `review`) so UAT works without buttons.  
   After the Card Request URL is set, optionally set Vercel env `LARK_ENABLE_CARD_BUTTONS=1` to show buttons again.
6. Permissions: `im:message` / send-as-bot; image resources if you want OCR.
7. **Leave Encrypt Key OFF / empty**.
8. Verification Token: optional.
9. **Publish** the app version → open DM → send `Hi`.

Check readiness:

```bash
curl -sS https://vex-llm-proxy.vercel.app/api/lark/event
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
| `LARK_ENCRYPT_KEY` | **Do not use** until decrypt is implemented — keep Encrypt Key off |
| `DESK_GATEWAY_TOKEN` | Protects desk smoke `/api/lark/incidents` only; unrelated to Lark chat |
| `LARK_ADMIN_OPEN_ID` | **Required for weekly + 30-min market push** — Yan Haixiang’s Feishu `open_id` (DM target) |
| `LARK_ADMIN_EMAIL` | Optional fallback to resolve open_id via Contact API |
| `CRON_SECRET` | Optional; Vercel Cron Authorization bearer for cron routes |

## Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET/POST | `/api/lark/event` | Webhook (challenge + messages + card actions) |
| GET/POST | `/api/lark/card` | Alias for **Card Request URL** (same handler) |
| GET/POST | `/api/lark/incidents` | List / simulate turns (smoke) |
| GET/POST | `/api/lark/weekly-report` | Weekly digest (cron Fridays 16:00 CST → Yan); `?dry=1` preview |
| GET/POST | `/api/lark/market-report` | 30-min market scan DM to Yan; `?dry=1` preview |
| GET/POST | `/api/lark/daily-market-report` | Daily 08:00 CST 24h digest → group; `?dry=1` preview |

## Weekly report (Yan Haixiang)

- **Schedule:** every **Friday 16:00 Asia/Shanghai** (Vercel cron `0 8 * * 5` UTC)
- **Content:** this week’s handled incidents + aggregated recommendations / Skills
- **Delivery:** Feishu DM card to `LARK_ADMIN_OPEN_ID` (Yan Haixiang)
- **On-demand:** send `weekly` / `周报` in chat
- **Preview:** `curl -sS 'https://vex-llm-proxy.vercel.app/api/lark/weekly-report?dry=1' -H "X-Desk-Token: $DESK_GATEWAY_TOKEN"`
- **Force send:** `POST /api/lark/weekly-report` with `{ "force": true }` + desk token

## 30-minute market report (Yan Haixiang)

- **Schedule:** every **30 minutes** (Vercel cron `*/30 * * * *`)
- **Content:** same hourly market scan engine as chat `行情` / `market` (TL;DR / Opportunity / Risk)
- **Delivery:** Feishu card to **chat_id** `LARK_MARKET_CHAT_ID` / `LARK_ADMIN_CHAT_ID` (default Yan DM `oc_430fae67dd06b70f65b726b1673ef40e`); falls back to `LARK_ADMIN_OPEN_ID` if chat send fails
- **Preview:** `curl -sS 'https://vex-llm-proxy.vercel.app/api/lark/market-report?dry=1' -H "X-Desk-Token: $DESK_GATEWAY_TOKEN"`
- **Force send:** `POST /api/lark/market-report` with `{ "force": true }` + desk token

Set `LARK_MARKET_CHAT_ID` (preferred) and/or `LARK_ADMIN_OPEN_ID` on Vercel Production.

## Daily 24h market morning report (group)

- **Schedule:** every day **08:00 Asia/Shanghai** (Vercel cron `0 0 * * *` UTC)
- **Content:** past-24h OKX 1H range (O/H/L/C / %) + TL;DR / Opportunity / Risk
- **Delivery:** Feishu group `LARK_DAILY_MARKET_CHAT_ID` (default `oc_eb8eba24ff99a2c3ea3c9439750d65cd`)
- **Preview:** `curl -sS 'https://vex-llm-proxy.vercel.app/api/lark/daily-market-report?dry=1' -H "X-Desk-Token: $DESK_GATEWAY_TOKEN"`
- **Force send:** `POST /api/lark/daily-market-report` with `{ "force": true }` + desk token / cron header

## Bot behaviour

1. **Greeting** — natural hello on @mention / hi / 你好 (SGT time-of-day).
2. **Market Q&A** — OKX + desk links.
3. **Off-topic / safety** — gentle reject; no PII, cursing, or political topics.
4. **Investigate** — alerts/text/image/table; adaptive steps; emoji + bold bullets; AIPO evidence grades (Confirmed / Suspected / Unknown + [OBS]/[DESIGN]/…).
5. **RAG + Skills** — desk + quote-ops V Exchange perpetual (`v-exchange-perp`; CFD excluded).
6. **Dashboard** — `review` / `dashboard` → KPI card + https://vex-llm-proxy.vercel.app/#/reports
7. **Wiki / Docs (AIPO)** — read-only Lark Wiki search + Docx excerpt when scopes allow; otherwise contact **@Yan Haixiang**.

Commands: `help` · `market` · `investigate` · `review` · `dashboard` · `wiki` · `knowledge` / `kb` · `weekly` / `周报` · `done` / `archive`

## AIPO Lark API UAT (OWNLAB「Lark API 接入需求」)

| Acceptance | Prod status |
|------------|-------------|
| Read authorized Wiki / Docs | Implemented (read-only); needs Wiki/Docs scopes — else @Yan |
| Read authorized group messages | Live events + best-effort history on group investigate |
| DM / @Bot bidirectional chat | Done |
| Active push to user/group | Done (alerts + Fri 16:00 CST weekly DM) |
| Interactive cards + callback | Done |
| Unauthorized data/groups blocked | Done (access gate → @Yan; min scopes) |
| Auditable ops / credential hygiene | Inbound + investigate/wiki audit log; secrets on Vercel only |

Source: OWNLAB notebook «Lark api 调用需求文档» (RC AI Agent × Lark Integration). Later polish (daypart, weekly, FAQ, greeting footer) is preserved.

## Smoke without Lark credentials

```bash
curl -sS -X POST https://vex-llm-proxy.vercel.app/api/lark/incidents \
  -H 'Content-Type: application/json' \
  -d '{"text":"investigate IDX-01 excluded, Mark 48bps"}'
```

(May return `Unauthorized` if `DESK_GATEWAY_TOKEN` is set on the host.)

## Security

- Never paste App Secret into chat or git.
- Preferred Actions always need human approval — the bot never claims production execution.
