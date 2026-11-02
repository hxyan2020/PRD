/**
 * Skill playbooks for the desk-12 pack — one skill per scenario so AI RCA
 * can honestly match SKILL_* codes referenced on each alert.
 */
import type { SkillScenario } from "@/lib/ai/scenario-types";
import { DESK_12_SCENARIOS } from "@/lib/demo/desk-12-pack";

function ownerForAudience(audience: string): string {
  if (audience === "broker_admin") return "OPERATIONS";
  if (audience === "cfd_pricing") return "SYSTEM";
  if (audience === "perp_exchange") return "RISK_CONTROL";
  return "RISK_CONTROL";
}

function channelForAudience(audience: string): string {
  if (audience === "broker_admin") return "oc_ops_funding_recon";
  if (audience === "perp_exchange") return "oc_crypto_exchange_risk";
  if (audience === "cfd_pricing") return "oc_trading_infra";
  return "oc_risk_control_desk";
}

/** Build SkillScenario rows from desk-12 definitions + monitor thresholds. */
export const DESK_12_SKILL_SCENARIOS: SkillScenario[] = DESK_12_SCENARIOS.map((s) => {
  const primary = s.primary_indicators[0];
  const unitGuess =
    primary.includes("PCT") || primary.includes("RATIO") || primary.includes("HEDGE")
      ? "%"
      : primary.includes("ORACLE")
        ? "seconds"
        : primary.includes("BASIS")
          ? "bps"
          : primary.includes("SCORE") || primary.includes("ARB") || primary.includes("WASH") || primary.includes("IB")
            ? "score"
            : primary.includes("LIQ")
              ? "orders"
              : primary.includes("SEG") || primary.includes("WD") || primary.includes("NEWS")
                ? "USD"
                : primary.includes("SWAP")
                  ? "symbols"
                  : primary.includes("SPREAD")
                    ? "x"
                    : primary.includes("LP")
                      ? "%"
                      : "";

  return {
    code: s.skill_code,
    name: s.name.en,
    description: `${s.how_it_works.en} RAG topics: ${s.rag_topics.join("; ")}.`,
    indicator: {
      monitor_id: primary,
      name: primary,
      product: s.product.includes("Crypto") ? "Crypto" : "CFD",
      domain: s.domain_code,
      warn: Math.max(0, s.observed_value * 0.7),
      breach: s.observed_value * 0.95,
      unit: unitGuess,
      comparator: "gte",
      why: `Desk-12 ${s.code} primary monitor ${primary} on ${s.symbol} (${s.venue}).`,
    },
    related_indicators: s.related_indicators,
    conditions: {
      severity_in: ["WARN", "BREACH", "CRITICAL"],
      min_observed: Math.max(0, s.observed_value * 0.5),
    },
    fault_areas: [s.venue, s.symbol, ...s.rag_topics.slice(0, 2)],
    escalation: {
      sla_minutes: s.priority === 0 ? 10 : s.priority === 1 ? 20 : 45,
      path: [
        {
          after_minutes: 0,
          team: DESK_12_SCENARIOS.find((x) => x.code === s.code)?.audience === "broker_admin" ? "Ops War Room" : "Risk Control Desk",
          channel: channelForAudience(s.audience),
          action: "Lark + ticket",
        },
        {
          after_minutes: s.priority === 0 ? 10 : 25,
          team: "Risk Control Desk",
          channel: "oc_risk_control_desk",
          action: "Join war-room / RO gate",
        },
      ],
    },
    corrections: [
      {
        action: "collect_evidence",
        bu: "AI",
        description: `Pull Monitor ${primary} + RAG (${s.rag_topics[0]})`,
      },
      {
        action: "apply_noise_method",
        bu: "AI",
        description: `${s.noise.code}: ${s.noise.en}`,
      },
      {
        action: "flag_for_human_review",
        bu: "RISK_CONTROL",
        description: "RO confirms before irreversible controls",
        requires_human: true,
      },
    ],
    past_cases: [
      {
        case_id: `CASE-${s.code.replace(/^SCN-/, "")}`,
        date: "2026-10-28",
        alert_id: s.alert_id,
        outcome: "OPEN_ON_DESK",
        summary: `${s.name.en} — seeded open for live close walk; not a fake closed outcome.`,
      },
    ],
    owner_department: ownerForAudience(s.audience),
    auto_execute: false,
    steps: [
      {
        action: "lark_notify",
        description: `Notify ${s.audience} desk`,
        params: { channel: channelForAudience(s.audience) },
        bu: ownerForAudience(s.audience),
      },
      {
        action: "rag_retrieve",
        description: `Retrieve RAG: ${s.rag_topics.join(", ")}`,
        bu: "AI",
      },
      {
        action: "flag_for_human_review",
        description: "RO / maker-checker before containment",
        requires_human: true,
        bu: "RISK_CONTROL",
      },
    ],
  } satisfies SkillScenario;
});
