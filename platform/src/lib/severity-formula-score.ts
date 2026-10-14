/** Client-safe severity formula scorer (no DB / Node imports). */

import type { FormulaObservations, SeverityFormula } from "@/lib/severity-formula-shared";

export type SeverityP = 0 | 1 | 2 | 3;

const P_TO_OPS: Record<SeverityP, string> = {
  0: "CRITICAL",
  1: "BREACH",
  2: "WARN",
  3: "INFO",
};

export function scoreSeverityFormula(
  formula: SeverityFormula,
  observations: FormulaObservations
): {
  score: number;
  p: SeverityP;
  ops: string;
  contributions: Array<{ id: string; raw: number; weighted: number; enabled: boolean }>;
} {
  const contributions = formula.factors.map((f) => {
    const raw = Number(observations[f.id] ?? 0);
    const weighted = f.enabled ? raw * f.weight : 0;
    return { id: f.id, raw, weighted, enabled: f.enabled };
  });
  const score = Math.round(contributions.reduce((s, c) => s + c.weighted, 0) * 100) / 100;
  let p: SeverityP = 3;
  if (score >= formula.thresholds.p0) p = 0;
  else if (score >= formula.thresholds.p1) p = 1;
  else if (score >= formula.thresholds.p2) p = 2;
  return { score, p, ops: P_TO_OPS[p], contributions };
}
