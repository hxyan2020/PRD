import type { UiLocale } from "@/lib/i18n";

type Pair = { en: string; "zh-Hant": string };

export const THINKING_ACTIONS = new Set([
  "show_evidence",
  "escalate",
  "dismiss",
  "close",
  "recommend",
  "chat",
  "confirm_action",
  "checker_approve",
]);

const THINK_SCRIPTS: Record<string, Pair[]> = {
  show_evidence: [
    { en: "Reading the Monitor alert and linked indicator series…", "zh-Hant": "讀取 Monitor 警報與連結指標序列…" },
    { en: "Matching Evidence Vault packs for this symbol and cohort…", "zh-Hant": "比對此商品與族群的證據庫附件…" },
    { en: "Ranking snippets by freshness and breach proximity…", "zh-Hant": "依時效與越界接近度排序片段…" },
  ],
  escalate: [
    { en: "Checking SLA clock and current escalation step…", "zh-Hant": "檢查 SLA 計時與目前升級步驟…" },
    { en: "Selecting the next on-call desk from the route…", "zh-Hant": "從升級路徑選出下一值班台…" },
    { en: "Drafting a handoff note with severity and evidence pointers…", "zh-Hant": "草擬含嚴重度與證據指向的交接說明…" },
  ],
  dismiss: [
    { en: "Re-reading the AI report against the live book snapshot…", "zh-Hant": "對照即時帳冊重讀 AI 報告…" },
    { en: "Looking for contradicting ticks that would make this a false alarm…", "zh-Hant": "尋找足以判定誤報的反向訊號…" },
    { en: "Preparing a dismiss audit trail for Risk Desk…", "zh-Hant": "準備供風險台備查的排除稽核紀錄…" },
  ],
  close: [
    { en: "Summarising primary + challenger RCA agreement…", "zh-Hant": "彙整主分析與挑戰者 RCA 共識…" },
    { en: "Confirming no irreversible control is still pending…", "zh-Hant": "確認沒有尚未完成的不可逆控制…" },
    { en: "Closing the thread as accepted AI analysis…", "zh-Hant": "以接受 AI 分析結案此執行緒…" },
  ],
  recommend: [
    { en: "Scoring available controls against the alert mode…", "zh-Hant": "依警報模式為可用控制項評分…" },
    { en: "Checking maker-checker rules for {code}…", "zh-Hant": "檢查 {code} 的 Maker-Checker 規則…" },
    { en: "Drafting a proposal the desk can double-confirm…", "zh-Hant": "草擬可供台面雙重確認的建議…" },
  ],
  chat: [
    { en: "Attaching your note to the open case…", "zh-Hant": "將你的備註附加到本案…" },
    { en: "Checking whether this challenges the AI report…", "zh-Hant": "判斷是否在挑戰 AI 報告…" },
    { en: "Drafting a desk-facing reply…", "zh-Hant": "草擬給風險台的回覆…" },
  ],
  confirm_action: [
    { en: "Replaying the proposed control and its blast radius…", "zh-Hant": "重放建議控制項與影響範圍…" },
    { en: "Confirming double-confirm was explicit…", "zh-Hant": "確認已明確完成雙重確認…" },
    { en: "Queuing the payload for Vantage Markets admin…", "zh-Hant": "將內容排入 Vantage Markets 管理後台…" },
  ],
  checker_approve: [
    { en: "Loading the maker request and checker policy…", "zh-Hant": "載入 Maker 申請與 Checker 政策…" },
    { en: "Verifying four-eyes still applies for this control…", "zh-Hant": "確認此控制項仍需四人原則…" },
    { en: "Releasing the live action to the trading stack…", "zh-Hant": "將實時動作下放到交易堆疊…" },
  ],
};

export function thinkingSteps(action: string, locale: UiLocale, extra: Record<string, unknown> = {}): string[] {
  const script = THINK_SCRIPTS[action] || THINK_SCRIPTS.close;
  const code = String(extra.action_code || extra.pending_id || "this action");
  return script.map((line) => {
    const text = locale === "zh-Hant" ? line["zh-Hant"] : line.en;
    return text.replace(/\{code\}/g, code);
  });
}
