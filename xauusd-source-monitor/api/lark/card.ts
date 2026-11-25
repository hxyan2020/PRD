/**
 * Alias for Lark / Feishu **Card Request URL** (消息卡片请求网址).
 * Same handler as `/api/lark/event` — set console Card Request URL to:
 *   https://quote-ai-troubleshooting-bot.vercel.app/api/lark/card
 * or the event URL. Without this URL, tapping card buttons shows
 * “Card callback isn't configured”.
 */
export { default, config } from './event.js'
