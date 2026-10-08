import type { CorrectionAction, EscalationHop } from "@/lib/ai/scenario-types";

const BU_ZH: Record<string, string> = {
  RISK_CONTROL: "風險控制",
  OPERATIONS: "營運",
  AI: "AI",
  SYSTEM: "系統",
  EXEC: "高階主管",
  CUSTOMER_SERVICE: "客服",
  TRADING: "交易台",
};

const TEAM_ZH: Record<string, string> = {
  "Credit Desk": "信貸台",
  "Risk Owner": "風險負責人",
  "Risk Control": "風險控制",
  "Trading Infra": "交易基建",
  "Crypto Risk": "加密風險",
  "Ops Lead": "營運主管",
  "CS Lead": "客服主管",
  "TR Desk": "交易台",
  "AI Engineer": "AI 工程",
  "System Admin": "系統管理員",
  "System on-call": "系統值班",
  Finance: "財務",
  Compliance: "合規",
  Product: "產品",
  Pricing: "報價",
  Exec: "高管",
};

/** Lightweight EN→繁中 for desk playbook lines (keeps M2-* / SKILL-* / ESC-* codes). */
export function zhDeskLine(en: string): string {
  let s = en;
  const reps: Array<[RegExp, string]> = [
    [/\bNotify\b/gi, "通知"],
    [/\bPage\b/gi, "呼叫"],
    [/\bActivate\b/gi, "啟用"],
    [/\bConfirm\b/gi, "確認"],
    [/\bCheck\b/gi, "檢查"],
    [/\bVerify\b/gi, "核對"],
    [/\bFreeze\b/gi, "凍結"],
    [/\bPause\b/gi, "暫停"],
    [/\bHalt\b/gi, "停牌"],
    [/\bWiden\b/gi, "拉闊"],
    [/\bRevert\b/gi, "回滾"],
    [/\bRoll back\b/gi, "回滾"],
    [/\bEscalate\b/gi, "升級"],
    [/\bInvestigate\b/gi, "調查"],
    [/\bCorrelate\b/gi, "關聯"],
    [/\bSeparate\b/gi, "區分"],
    [/\bDo not\b/gi, "勿"],
    [/\bNever\b/gi, "絕勿"],
    [/\bhuman gate\b/gi, "人工關卡"],
    [/\bHuman-gated\b/gi, "人工關卡"],
    [/\bHuman gate\b/gi, "人工關卡"],
    [/\bmaker\/checker\b/gi, "Maker／Checker"],
    [/\bclose-only\b/gi, "僅平倉"],
    [/\bleverage\b/gi, "槓桿"],
    [/\bmargin\b/gi, "保證金"],
    [/\bstop-?out\b/gi, "強平"],
    [/\bwithdrawal\b/gi, "出金"],
    [/\bdeposit\b/gi, "入金"],
    [/\bhot wallet\b/gi, "熱錢包"],
    [/\bcold sweep\b/gi, "冷錢包歸集"],
    [/\binsurance fund\b/gi, "保險基金"],
    [/\boracle\b/gi, "預言機"],
    [/\bfeed\b/gi, "饋送"],
    [/\bstale\b/gi, "過期"],
    [/\bslippage\b/gi, "滑點"],
    [/\bspread\b/gi, "點差"],
    [/\bcomplaint\b/gi, "投訴"],
    [/\bfraud\b/gi, "詐欺"],
    [/\bcluster\b/gi, "叢集"],
    [/\bcopy provider\b/gi, "跟單提供者"],
    [/\bcopier\b/gi, "跟單者"],
    [/\btoxic\b/gi, "有毒"],
    [/\beconomic calendar\b/gi, "經濟日曆"],
    [/\bentity\b/gi, "實體"],
    [/\bsegregation\b/gi, "客戶資金隔離"],
    [/\breconciliation\b/gi, "對帳"],
    [/\bCause:\b/g, "原因："],
    [/\bLinked skills:\b/gi, "連結技能："],
    [/\bCredit & Client Risk\b/gi, "信貸與客戶風險"],
    [/\bCrypto Risk \+ Infra\b/gi, "加密風險＋基建"],
    [/\bTrading Infra P1\b/gi, "交易基建 P1"],
    [/\bShadow-disable noisy detector\b/gi, "陰影停用噪音偵測器"],
    [/\bPropose threshold change via AI Admin\b/gi, "經 AI Admin 提案調整門檻"],
    [/\bQueue retrain\b/gi, "排隊重新訓練"],
    [/\bPropose\b/gi, "提案"],
    [/\bQueue\b/gi, "排隊"],
    [/\bthreshold\b/gi, "門檻"],
    [/\bretrain\b/gi, "重新訓練"],
    [/\bShadow-disable\b/gi, "陰影停用"],
    [/\bnoisy detector\b/gi, "噪音偵測器"],
    [/\bdetector\b/gi, "偵測器"],
  ];
  for (const [re, to] of reps) s = s.replace(re, to);
  for (const [enBu, zhBu] of Object.entries(BU_ZH)) {
    s = s.replace(new RegExp(`\\b${enBu}\\b`, "g"), zhBu);
  }
  return s;
}

export function zhEscalationHops(path: EscalationHop[], slaMinutes?: number, route?: string): string {
  const hops = path
    .map((h) => {
      const team = TEAM_ZH[h.team] || zhDeskLine(h.team);
      return `T+${h.after_minutes}分 ${team}/${h.channel}：${zhDeskLine(h.action)}`;
    })
    .join(" → ");
  const head = route ? `${route}${slaMinutes != null ? `（SLA ${slaMinutes} 分）` : ""}` : "";
  if (head && hops) return `${head}：${hops}`;
  if (head) return `${head}：台面預設`;
  return hops || "台面預設升級路徑";
}

export function zhCorrections(corrections: CorrectionAction[]): string[] {
  return corrections.map((c) => {
    const bu = BU_ZH[c.bu] || c.bu;
    return `${c.action}（${bu}）：${zhDeskLine(c.description)}`;
  });
}

export function zhLines(lines: string[]): string[] {
  return lines.map(zhDeskLine);
}

export function zhTimeline(
  events: Array<{ t_minutes: number; monitor_id: string; severity: string; signal: string }>
): string[] {
  return events.map(
    (e) => `T+${e.t_minutes}分 ${e.monitor_id} ${e.severity}：${zhDeskLine(e.signal)}`
  );
}

/** Prefer explicit zh list; else translate English list. */
export function coalesceZh(explicit: string[] | undefined, en: string[]): string[] {
  if (explicit?.length) return explicit;
  return zhLines(en);
}
