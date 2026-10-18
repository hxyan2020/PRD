/** Client-safe stages for the Monitor 2.0 threshold adjustment full flow. */

export type ThresholdFlowStageId =
  | "OBSERVE"
  | "AI_SUGGEST"
  | "DRAFT_CR"
  | "MAKER_CHECKER"
  | "APPLY_M2"
  | "AUDIT";

export type ThresholdFlowStage = {
  id: ThresholdFlowStageId;
  en: string;
  zh: string;
  detail_en: string;
  detail_zh: string;
};

/** End-to-end path: noise/alarm → AI suggest → CR → dual control → live Monitor 2.0 → audit. */
export const THRESHOLD_FLOW_STAGES: ThresholdFlowStage[] = [
  {
    id: "OBSERVE",
    en: "1. Observe vs live band",
    zh: "1. 對照線上門檻取樣",
    detail_en: "Monitor 2.0 samples the indicator; warn/breach bands decide WARN vs BREACH.",
    detail_zh: "Monitor 2.0 取樣指標；warn／breach 分帶決定 WARN 或 BREACH。",
  },
  {
    id: "AI_SUGGEST",
    en: "2. AI how-to-improve: X → Y",
    zh: "2. AI 如何改進：X → Y",
    detail_en: "Improvement review proposes tighten/loosen warn/breach (THRESHOLD item). AI never writes live numbers.",
    detail_zh: "改進審查建議收緊／放寬 warn／breach（THRESHOLD 項）。AI 從不寫入線上數字。",
  },
  {
    id: "DRAFT_CR",
    en: "3. Draft change request",
    zh: "3. 起草變更請求",
    detail_en: "AI Admin / skill CR captures from→to, monitor id, and rationale for dual control.",
    detail_zh: "AI 管理／技能 CR 記錄 from→to、指標 id 與理由，供雙重控制。",
  },
  {
    id: "MAKER_CHECKER",
    en: "4. Owner BU + System dual control",
    zh: "4. 負責 BU＋系統雙重控制",
    detail_en: "Maker proposes; Checker (owner BU + System) approves. Production thresholds are out of AI scope.",
    detail_zh: "Maker 提案；Checker（負責 BU＋系統）核准。正式門檻不在 AI 職責內。",
  },
  {
    id: "APPLY_M2",
    en: "5. Apply on Monitor 2.0",
    zh: "5. 在 Monitor 2.0 套用",
    detail_en: "Operator saves warn/breach via IndicatorThresholdEditor → POST update_thresholds (detectors synced).",
    detail_zh: "操作員經門檻編輯器儲存 warn／breach → POST update_thresholds（偵測器同步）。",
  },
  {
    id: "AUDIT",
    en: "6. Audit + optional rollback",
    zh: "6. 稽核＋可選回滾",
    detail_en: "UPDATE_THRESHOLDS audit stores before/after; Risk Log / rollback can restore prior band.",
    detail_zh: "UPDATE_THRESHOLDS 稽核保存前後值；風險日誌／回滾可還原先前分帶。",
  },
];

export const THRESHOLD_FLOW_LABELS = {
  title_en: "Threshold adjustment full flow",
  title_zh: "門檻調整全流程",
  blurb_en:
    "Watch how a noisy or breached band moves from observation → AI X→Y suggest → CR → maker/checker → live Monitor 2.0 apply → audit.",
  blurb_zh:
    "觀看嘈雜或違規分帶如何從取樣 → AI 建議 X→Y → CR → Maker／Checker → Monitor 2.0 線上套用 → 稽核。",
  demo_monitor: "M2-EQ-001",
  from_warn: 3,
  from_breach: 5,
  to_warn: 2.4,
  to_breach: 4,
  unit: "%",
} as const;
