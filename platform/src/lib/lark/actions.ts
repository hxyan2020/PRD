/**
 * Lark card buttons call the same CRMP messenger / CS APIs as Demo Messenger.
 */
import { getDb, writeAudit } from "@/lib/db";
import {
  getLarkCard,
  markLarkCardsForAlert,
  markLarkCardsForThread,
  postLarkCard,
  setLarkCardStatus,
  type LarkCard,
} from "@/lib/lark/cards";
import { messengerAction } from "@/lib/messenger/demo";
import type { UiLocale } from "@/lib/i18n";

export type LarkCardAction = "ack" | "escalate" | "dismiss" | "close";

export function applyLarkCardAction(input: {
  card_id: number;
  action: LarkCardAction;
  user_name: string;
  locale?: UiLocale;
}): { ok: true; card: LarkCard; mock: true } {
  const card = getLarkCard(input.card_id);
  if (!card) throw new Error("Card not found");
  const zh = input.locale === "zh-Hant";
  const db = getDb();

  if (input.action === "ack") {
    if (card.alert_db_id) {
      db.prepare(
        `UPDATE monitor_alerts
         SET status = CASE WHEN status = 'OPEN' THEN 'ACKNOWLEDGED' ELSE status END,
             acknowledged_at = COALESCE(acknowledged_at, datetime('now'))
         WHERE id = ?`
      ).run(card.alert_db_id);
    }
    setLarkCardStatus(card.id, "ACKED");
    writeAudit({ name: input.user_name }, "LARK_CARD_ACK", "lark_card", card.card_id, {
      thread_db_id: card.thread_db_id,
      alert_db_id: card.alert_db_id,
      mock: true,
    });
    return { ok: true, card: getLarkCard(card.id)!, mock: true };
  }

  if (input.action === "escalate") {
    if (card.thread_db_id) {
      messengerAction({
        thread_id: card.thread_db_id,
        action: "escalate",
        user_name: input.user_name,
        locale: input.locale,
      });
    } else {
      postLarkCard({
        chat_id: "oc_risk_control_desk",
        kind: "ESCALATION",
        title: `Escalate · ${card.title}`,
        body: zh
          ? `⬆️ Lark 卡片已升級至風險控管台（模擬）。\n來源頻道：${card.chat_id}`
          : `⬆️ Lark card escalated to Risk Control Desk (mock).\nFrom: ${card.chat_id}`,
        severity: card.severity,
        cs_request_id: card.cs_request_id,
        actor: input.user_name,
        dedupe: false,
      });
    }
    setLarkCardStatus(card.id, "ESCALATED");
    writeAudit({ name: input.user_name }, "LARK_CARD_ESCALATE", "lark_card", card.card_id, {
      thread_db_id: card.thread_db_id,
      mock: true,
    });
    return { ok: true, card: getLarkCard(card.id)!, mock: true };
  }

  if (input.action === "dismiss") {
    if (card.thread_db_id) {
      messengerAction({
        thread_id: card.thread_db_id,
        action: "dismiss",
        user_name: input.user_name,
        locale: input.locale,
      });
    } else if (card.alert_db_id) {
      db.prepare(`UPDATE monitor_alerts SET status = 'CLOSED' WHERE id = ?`).run(card.alert_db_id);
    }
    if (card.thread_db_id) markLarkCardsForThread(card.thread_db_id, "DISMISSED");
    else if (card.alert_db_id) markLarkCardsForAlert(card.alert_db_id, "DISMISSED");
    else setLarkCardStatus(card.id, "DISMISSED");
    writeAudit({ name: input.user_name }, "LARK_CARD_DISMISS", "lark_card", card.card_id, { mock: true });
    return { ok: true, card: getLarkCard(card.id)!, mock: true };
  }

  if (input.action === "close") {
    if (card.thread_db_id) {
      messengerAction({
        thread_id: card.thread_db_id,
        action: "close",
        user_name: input.user_name,
        locale: input.locale,
      });
    } else if (card.alert_db_id) {
      db.prepare(`UPDATE monitor_alerts SET status = 'CLOSED' WHERE id = ?`).run(card.alert_db_id);
    }
    if (card.thread_db_id) markLarkCardsForThread(card.thread_db_id, "CLOSED");
    else if (card.alert_db_id) markLarkCardsForAlert(card.alert_db_id, "CLOSED");
    else setLarkCardStatus(card.id, "CLOSED");
    writeAudit({ name: input.user_name }, "LARK_CARD_CLOSE", "lark_card", card.card_id, { mock: true });
    return { ok: true, card: getLarkCard(card.id)!, mock: true };
  }

  throw new Error(`Unknown card action ${input.action}`);
}
