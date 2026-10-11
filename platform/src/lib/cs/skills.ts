import { CS_SKILL_SCENARIOS } from "@/lib/ai/risk-scenarios-cs";
import { SKILL_ZH } from "@/lib/ai/skill-zh";
import type { UiLocale } from "@/lib/i18n";

type CsClarity = "clear" | "unclear" | "need_id";
type CsDesk = "CS" | "TR";

export const CS_SKILL_CODES = {
  clarify: "SKILL-CS-CLARIFY",
  idVerify: "SKILL-CS-ID-VERIFY",
  accountFaq: "SKILL-CS-ACCOUNT-FAQ",
  execution: "SKILL-TR-EXECUTION",
  escalateRisk: "SKILL-CS-ESCALATE-RISK",
} as const;

export type CsSkillCode = (typeof CS_SKILL_CODES)[keyof typeof CS_SKILL_CODES];

const BOOK_RISK_RE =
  /margin cascade|stop-?out cascade|fraud|chargeback|hack|stolen account|wallet drain|liquidation cluster|保證金連鎖|詐騙|熱錢包|盜用/i;

/** Map heuristic triage onto a dedicated SKILL.md playbook. */
export function skillCodeForTriage(input: {
  clarity: CsClarity;
  desk: CsDesk;
  category: string;
  subject?: string;
  body?: string;
}): CsSkillCode {
  if (input.clarity === "need_id") return CS_SKILL_CODES.idVerify;
  if (input.clarity === "unclear") return CS_SKILL_CODES.clarify;
  if (input.desk === "TR" || input.category === "trading") return CS_SKILL_CODES.execution;
  const blob = `${input.subject || ""}\n${input.body || ""}`;
  if (input.category === "complaint" && BOOK_RISK_RE.test(blob)) return CS_SKILL_CODES.escalateRisk;
  return CS_SKILL_CODES.accountFaq;
}

export function csSkillName(code: string | null | undefined, locale: UiLocale = "en"): string {
  if (!code) return "";
  if (locale === "zh-Hant" && SKILL_ZH[code]?.name) return SKILL_ZH[code].name;
  return CS_SKILL_SCENARIOS.find((s) => s.code === code)?.name || code;
}

export function csSkillHref(code: string) {
  return `/admin/skills/${encodeURIComponent(code)}`;
}
