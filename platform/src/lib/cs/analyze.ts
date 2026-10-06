/**
 * After the wait loop has enough facts: categorize, assign severity,
 * draft a solution + client reply, then auto-send or hold for a POC.
 * Prototype heuristic — no live LLM on this path (same as triageText).
 */
import { CS_POC_SPECS } from "@/lib/cs/params";
import { CS_SKILL_CODES } from "@/lib/cs/skills";
import type { UiLocale } from "@/lib/i18n";

export const CS_SEVERITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
export type CsSeverity = (typeof CS_SEVERITIES)[number];

export type CsSensitivity = "auto" | "poc";

export type CsAnalysis = {
  category: string;
  severity: CsSeverity;
  sensitivity: CsSensitivity;
  solution: string;
  draft: string;
  poc_role: string | null;
  poc_name: string | null;
  reason: string;
};

const RANK: Record<CsSeverity, number> = { LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 };

const CRITICAL_RE =
  /\b(lawsuit|chargeback|stolen account|wallet drain|hack|fraud|scam|legal action|起訴|盜用|熱錢包|詐騙|法律)\b/i;
const HIGH_RE =
  /\b(complaint|angry|refund|withdraw blocked|stop-?out|liquidation|cannot withdraw|投訴|退款|出金|強平)\b/i;
const MEDIUM_RE =
  /\b(slippage|fill|reject|requote|login|kyc|verify|mt4|mt5|成交|點差|拒單|核身|登入)\b/i;

const UID_RE = /\b(?:UID\s*)?\d{4,}\b/i;

export function severityRank(s: string | null | undefined): number {
  const key = String(s || "LOW").toUpperCase() as CsSeverity;
  return RANK[key] ?? 1;
}

export function parseSeverity(raw: string | null | undefined, fallback: CsSeverity = "MEDIUM"): CsSeverity {
  const v = String(raw || "").toUpperCase();
  return (CS_SEVERITIES as readonly string[]).includes(v) ? (v as CsSeverity) : fallback;
}

export function parseSensitiveCategories(raw: string | null | undefined): string[] {
  const parts = String(raw || "complaint,kyc,trading")
    .split(/[,;\s]+/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return parts.length ? parts : ["complaint", "kyc", "trading"];
}

/** Reply after a wait-loop is long enough and names a UID — treat as collected even if KYC keywords remain. */
export function isCollectedReply(input: {
  previousStatus?: string | null;
  inboundCount: number;
  latest: string;
  clarity: string;
}): boolean {
  if (input.clarity === "clear") return true;
  const waiting =
    input.previousStatus === "ID_VERIFY" ||
    input.previousStatus === "AWAITING_CLIENT" ||
    input.previousStatus === "POC_REVIEW" ||
    input.previousStatus === "AI_REPLIED";
  if (!waiting || input.inboundCount < 2) return false;
  const blob = input.latest.replace(/\s+/g, " ").trim();
  return blob.length >= 48 && UID_RE.test(blob);
}

export function scoreSeverity(input: { subject: string; body: string; category: string; desk: string }): CsSeverity {
  const blob = `${input.subject}\n${input.body}`;
  if (CRITICAL_RE.test(blob)) return "CRITICAL";
  if (input.category === "complaint" || HIGH_RE.test(blob)) return "HIGH";
  if (input.desk === "TR" || input.category === "trading" || input.category === "kyc" || MEDIUM_RE.test(blob)) {
    return "MEDIUM";
  }
  return "LOW";
}

export function scoreSensitivity(input: {
  severity: CsSeverity;
  category: string;
  skillCode: string | null | undefined;
  autoMax: CsSeverity;
  sensitiveCategories: string[];
}): CsSensitivity {
  if (input.skillCode === CS_SKILL_CODES.escalateRisk) return "poc";
  if (input.skillCode === CS_SKILL_CODES.execution) return "poc";
  if (input.skillCode === CS_SKILL_CODES.idVerify) return "poc";
  if (input.sensitiveCategories.includes(String(input.category || "").toLowerCase())) return "poc";
  if (severityRank(input.severity) > severityRank(input.autoMax)) return "poc";
  return "auto";
}

function pocFor(role: string): { poc_role: string; poc_name: string } {
  const hit = CS_POC_SPECS.find((p) => p.role === role);
  return { poc_role: role, poc_name: hit?.name || role };
}

function pickPoc(input: { sensitivity: CsSensitivity; desk: string; category: string; skillCode: string | null }): {
  poc_role: string | null;
  poc_name: string | null;
} {
  if (input.sensitivity !== "poc") return { poc_role: null, poc_name: null };
  if (input.skillCode === CS_SKILL_CODES.escalateRisk) return pocFor("CS_LEAD");
  if (input.desk === "TR" || input.category === "trading" || input.skillCode === CS_SKILL_CODES.execution) {
    return pocFor("TR_DEALER");
  }
  if (input.category === "kyc" || input.skillCode === CS_SKILL_CODES.idVerify) return pocFor("CS_AGENT");
  if (input.category === "complaint") return pocFor("CS_LEAD");
  return pocFor("CS_LEAD");
}

function copyFor(
  input: {
    requestId: string;
    clientName: string;
    category: string;
    severity: CsSeverity;
    skillCode: string | null;
    desk: string;
    latest: string;
  },
  zh: boolean
): { solution: string; draft: string; reason: string } {
  const skill = input.skillCode || "";
  if (skill === CS_SKILL_CODES.escalateRisk || input.severity === "CRITICAL") {
    return {
      reason: "critical_or_book_risk",
      solution: zh
        ? "嚴重度 CRITICAL／帳簿風險。AI 不得直接回客戶。草稿給 POC 補法律／風控細節後，經 Demo Messenger／人工干預升級。"
        : "CRITICAL / book-risk. AI must not reply to the client. Draft is for the POC to add legal/risk detail, then escalate via Demo Messenger / Human Intervention.",
      draft: zh
        ? `${input.clientName} 您好，\n\n我們已收到 ${input.requestId}。此案件涉及較高敏感度，需由值班 POC 人工審閱後回覆，不會由 AI 直接結案。\n\nVantage CS／TR`
        : `${input.clientName},\n\nWe have received ${input.requestId}. This case is sensitive, so a named POC will review it before any reply. AI will not close it on its own.\n\nVantage CS / TR`,
    };
  }
  if (skill === CS_SKILL_CODES.execution || input.desk === "TR" || input.category === "trading") {
    return {
      reason: "trading_poc",
      solution: zh
        ? "成交／滑點／拒單屬 TR。從 MT4／MT5 成交帶還原成交 vs LP。CS 不得改價。草稿由 TR Dealer 補實際成交後再寄。"
        : "Fills / slippage / rejects belong to TR. Reconstruct fill vs LP from the MT4/MT5 tape. CS must not reprice. TR Dealer adds the actual fill before the reply goes out.",
      draft: zh
        ? `${input.clientName} 您好，\n\n已收到 ${input.requestId} 的成交查詢。TR 成交支援正在核對成交帶，回覆前會由值班交易員補上實際成交結果。CS 不會改價。\n\nVantage TR`
        : `${input.clientName},\n\nWe have ${input.requestId} as an execution query. TR Dealing Support is checking the tape. A dealer will add the actual fill before this reply is sent. CS will not reprice.\n\nVantage TR`,
    };
  }
  if (input.category === "kyc" || skill === CS_SKILL_CODES.idVerify) {
    return {
      reason: "kyc_poc",
      solution: zh
        ? "核身資料已齊（僅旗標，不存證件圖）。CS 核身庫／值班 POC 確認 UID 後四碼與狀態後才可回覆。草稿不得複述證件內容。"
        : "ID facts are collected (flags only — no ID images stored). CS KYC Vault / on-call POC confirms UID last-four and status before any reply. The draft must not echo document contents.",
      draft: zh
        ? `${input.clientName} 您好，\n\n已收到 ${input.requestId} 的身分資料。核身團隊會核對帳戶狀態（僅旗標，證件圖不存工單）。審閱完成後由值班人員回覆，請勿再寄證件圖到此信件。\n\nVantage CS 核身庫`
        : `${input.clientName},\n\nWe have the identity facts for ${input.requestId}. The KYC team will confirm account status (flags only; ID images are not stored on the ticket). A named agent will reply after review — please do not resend ID images to this thread.\n\nVantage CS KYC Vault`,
    };
  }
  if (input.category === "complaint") {
    return {
      reason: "complaint_poc",
      solution: zh
        ? "投訴類。AI 可起草致歉與收件確認，但不得承認責任或承諾賠償。CS Lead 補政策細節後才寄出。"
        : "Complaint. AI may draft an acknowledgement, but must not admit liability or promise a refund. CS Lead adds policy detail before send.",
      draft: zh
        ? `${input.clientName} 您好，\n\n已將 ${input.requestId} 登記為投訴。客服主管會審閱後回覆處理方式。本信不是結案，也尚未承諾任何賠償。\n\nVantage CS Lead`
        : `${input.clientName},\n\n${input.requestId} is logged as a complaint. A CS Lead will review and reply with the handling path. This note is not a resolution and does not promise compensation.\n\nVantage CS Lead`,
    };
  }
  return {
    reason: "faq_auto",
    solution: zh
      ? "帳戶 FAQ（隔夜利息／交易時段／入金）。資料已齊。依 cs-swap-faq RAG 葉起草回覆，嚴重度未超過 cs.auto_reply_max_severity 時 AI 可直接寄出。"
      : "Account FAQ (swap / hours / deposit). Facts are complete. Draft from the cs-swap-faq RAG leaf. AI may send directly when severity is at or below cs.auto_reply_max_severity.",
    draft: zh
      ? `${input.clientName} 您好，\n\n關於 ${input.requestId}：隔夜利息依商品與持倉方向計算，週末常見三倍。此回覆依公開 FAQ，不是客製報價。若數字與帳戶不符，請回覆 UID 與持倉單號，我們改派人工。\n\nVantage CS 24/7`
      : `${input.clientName},\n\nOn ${input.requestId}: overnight swap follows the symbol and the side you held; weekends are commonly triple. This is the public FAQ, not a custom quote. If the figure on the account differs, reply with UID and the position ticket and we will hand it to a human.\n\nVantage CS 24/7`,
  };
}

export function analyzeCsRequest(
  input: {
    requestId: string;
    clientName: string;
    subject: string;
    body: string;
    latest: string;
    category: string;
    desk: string;
    skillCode: string | null;
    autoMax?: CsSeverity;
    sensitiveCategories?: string[];
    locale?: UiLocale;
  }
): CsAnalysis {
  const zh = input.locale === "zh-Hant";
  const latest = input.latest || input.body;
  const category = input.category || "question";
  const severity = scoreSeverity({
    subject: input.subject,
    body: latest,
    category,
    desk: input.desk,
  });
  const autoMax = input.autoMax || "MEDIUM";
  const sensitiveCategories = input.sensitiveCategories || parseSensitiveCategories(undefined);
  const sensitivity = scoreSensitivity({
    severity,
    category,
    skillCode: input.skillCode,
    autoMax,
    sensitiveCategories,
  });
  const poc = pickPoc({
    sensitivity,
    desk: input.desk,
    category,
    skillCode: input.skillCode,
  });
  const copy = copyFor(
    {
      requestId: input.requestId,
      clientName: input.clientName,
      category,
      severity,
      skillCode: input.skillCode,
      desk: input.desk,
      latest,
    },
    zh
  );
  return {
    category,
    severity,
    sensitivity,
    solution: copy.solution,
    draft: copy.draft,
    poc_role: poc.poc_role,
    poc_name: poc.poc_name,
    reason: copy.reason,
  };
}
