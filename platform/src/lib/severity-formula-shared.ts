/** Client-safe severity formula catalogue (no DB / Node imports). */

export type SeverityFactorId =
  | "breach_magnitude"
  | "book_contagion"
  | "duration_minutes"
  | "lp_health"
  | "client_impact"
  | "recurrence"
  | "overnight_gap";

export type SeverityFactorDef = {
  id: SeverityFactorId;
  enabled: boolean;
  weight: number;
  en: string;
  zh: string;
};

export type SeverityFormula = {
  version: string;
  factors: SeverityFactorDef[];
  thresholds: { p0: number; p1: number; p2: number };
  updated_at: string | null;
};

export type SeverityReasonCode = {
  id: string;
  en: string;
  zh: string;
};

export const SEVERITY_REASON_CODES: SeverityReasonCode[] = [
  { id: "overweight_magnitude", en: "Breach magnitude overweighted", zh: "違規幅度權重過高" },
  { id: "missed_contagion", en: "Book / copy contagion missed", zh: "漏判帳簿／跟單傳染" },
  { id: "one_off_spike", en: "One-off tick spike — recovered fast", zh: "單次 tick 尖峰 — 很快恢復" },
  { id: "wrong_book_scope", en: "Wrong book / cohort scope", zh: "帳簿／族群範圍不對" },
  { id: "stale_threshold", en: "Threshold / band stale vs current vol", zh: "門檻／分帶相對波動已過時" },
  { id: "missing_factor", en: "Missing factor (e.g. overnight / LP)", zh: "缺少因子（如隔夜／LP）" },
  { id: "should_upgrade", en: "Should be more severe", zh: "應更嚴重" },
  { id: "should_downgrade", en: "Should be less severe", zh: "應較輕" },
];

export const DEFAULT_SEVERITY_FORMULA: SeverityFormula = {
  version: "SF-v1",
  factors: [
    { id: "breach_magnitude", enabled: true, weight: 1.4, en: "Breach magnitude", zh: "違規幅度" },
    { id: "book_contagion", enabled: true, weight: 1.1, en: "Book / copy contagion", zh: "帳簿／跟單傳染" },
    { id: "duration_minutes", enabled: true, weight: 0.9, en: "Duration (minutes open)", zh: "持續時間（分鐘）" },
    { id: "lp_health", enabled: true, weight: 1.0, en: "LP / feed health", zh: "LP／饋送健康" },
    { id: "client_impact", enabled: true, weight: 0.8, en: "Client cohort impact", zh: "客戶族群影響" },
    { id: "recurrence", enabled: false, weight: 0.7, en: "Recurrence this week", zh: "本週復發次數" },
    { id: "overnight_gap", enabled: false, weight: 0.85, en: "Overnight / gap risk", zh: "隔夜／缺口風險" },
  ],
  thresholds: { p0: 4.2, p1: 3.0, p2: 1.8 },
  updated_at: null,
};

export type FormulaObservations = Partial<Record<SeverityFactorId, number>>;

/** Sample alert — lands on P1 with DEFAULT_SEVERITY_FORMULA. */
export const DEMO_ALERT_OBSERVATIONS: FormulaObservations = {
  breach_magnitude: 1.35,
  book_contagion: 0.35,
  duration_minutes: 0.55,
  lp_health: 0.4,
  client_impact: 0.45,
  recurrence: 0.3,
  overnight_gap: 0.2,
};

/** Client-safe shape of the weekly AI formula recommendation pack. */
export type WeeklyFormulaSuggestion = {
  week_key: string;
  sample_count: number;
  upgrades: number;
  downgrades: number;
  same: number;
  reason_histogram: Record<string, number>;
  current: SeverityFormula;
  suggested: SeverityFormula;
  factor_changes: Array<{
    id: string;
    change: "enable" | "disable" | "weight_up" | "weight_down" | "unchanged";
    from_weight: number;
    to_weight: number;
    from_enabled: boolean;
    to_enabled: boolean;
    en: string;
    zh: string;
  }>;
  rationale_en: string;
  rationale_zh: string;
  pending_cr_id: number | null;
  pending_request_id: string | null;
  pending_status: string | null;
  applied: boolean;
};
