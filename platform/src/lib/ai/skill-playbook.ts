import type { SkillScenario } from "@/lib/ai/scenario-types";
import { phrase, type UiLocale } from "@/lib/i18n";
import { SKILL_ZH } from "@/lib/ai/skill-zh";

/** Full operator playbook — catalog fields plus SKILL.md-style sections. */
export type SkillPlaybook = SkillScenario & {
  when_to_use: string[];
  when_not_to_use: string[];
  prechecks: string[];
  evidence_to_collect: string[];
  stop_conditions: string[];
  success_criteria: string[];
  owner_role: string;
  inputs: string[];
  outputs: string[];
};

function unique(items: string[]) {
  return [...new Set(items.filter((x) => x && x.trim()))];
}

function ownerRole(dept: string, locale: UiLocale) {
  if (locale === "zh-Hant") {
    if (dept === "OPERATIONS") return "營運主管";
    if (dept === "SYSTEM") return "系統管理員";
    if (dept === "AI") return "AI 工程師";
    if (dept === "EXEC") return "風險執行橋";
    if (dept === "CUSTOMER_SERVICE") return "客服主管／24/7 專員";
    if (dept === "TRADING") return "TR 成交主管／交易員";
    return "風險負責人／信貸台";
  }
  if (dept === "OPERATIONS") return "Ops Lead";
  if (dept === "SYSTEM") return "System Admin";
  if (dept === "AI") return "AI Engineer";
  if (dept === "EXEC") return "Exec Risk Bridge";
  if (dept === "CUSTOMER_SERVICE") return "CS Lead / 24-7 Agent";
  if (dept === "TRADING") return "TR Lead / Dealer";
  return "Risk Owner / Credit Desk";
}

/**
 * Finish a catalog skill into a complete playbook.
 * Prefer explicit catalog copy; fill remaining sections from trigger/thresholds
 * so every card has the same operator-grade SKILL.md structure.
 */
export function finalizeSkill(s: SkillScenario, locale: UiLocale = "en"): SkillPlaybook {
  const extra = s as SkillScenario & Partial<SkillPlaybook>;
  const zh = SKILL_ZH[s.code];
  const sev = (s.conditions.severity_in || ["WARN", "BREACH"]).join(" / ");
  const warn = `${s.indicator.warn}${s.indicator.unit}`;
  const breach = `${s.indicator.breach}${s.indicator.unit}`;
  const cmpEn = s.indicator.comparator === "lte" ? "at or below" : "at or above";
  const cmpZh = s.indicator.comparator === "lte" ? "低於或等於" : "高於或等於";
  const name = locale === "zh-Hant" && zh?.name ? zh.name : s.name;
  const description = locale === "zh-Hant" && zh?.description ? zh.description : s.description;
  const why = locale === "zh-Hant" && zh?.why ? zh.why : s.indicator.why;
  const indicatorName = locale === "zh-Hant" && zh?.indicator_name ? zh.indicator_name : s.indicator.name;
  const fault_areas =
    locale === "zh-Hant" && zh?.fault_areas?.length ? zh.fault_areas : s.fault_areas;

  const when_to_use = unique(
    extra.when_to_use?.length && locale === "en"
      ? extra.when_to_use
      : locale === "zh-Hant" && zh?.when_to_use?.length
        ? zh.when_to_use
        : locale === "zh-Hant"
          ? [
              `當 ${indicatorName}（${s.indicator.monitor_id}）達到警告 ${warn} 或違規 ${breach} 時使用本技能。`,
              `嚴重度須為 ${sev}。${why}`,
              description,
            ]
          : [
              `Use this skill when ${s.indicator.name} (${s.indicator.monitor_id}) is ${cmpEn} warn ${warn} (desk attention) or breach ${breach} (act).`,
              `Severity must be ${sev}. ${s.indicator.why}`,
              s.description,
            ]
  );

  const when_not_to_use = unique(
    extra.when_not_to_use?.length && locale === "en"
      ? extra.when_not_to_use
      : locale === "zh-Hant" && zh?.when_not_to_use?.length
        ? zh.when_not_to_use
        : locale === "zh-Hant"
          ? [
              "單筆測試登入、孤立 VIP 覆寫或已知 UAT 列印，不要跑這份劇本。",
              "主指標變紅不代表可以跳過確認 — 相關監控可能已能解釋。",
              "沒有下列人工關卡，不要執行不可逆控制（停商品、鎖帳戶、砍槓桿、暫停出金）。",
              "指標仍在違規時不要結案，除非風險負責人書面接受剩餘風險。",
            ]
          : [
              "Do not run this playbook on a single test login, isolated VIP override, or known UAT print.",
              "Do not skip confirmation checks just because the primary indicator is red — related monitors may explain it.",
              "Do not execute irreversible controls (halt symbol, block account, cut leverage, pause withdrawals) without the human gate listed below.",
              "Do not close the case while the indicator is still at breach unless Risk Owner has accepted residual risk in writing.",
            ]
  );

  const prechecks = unique(
    extra.prechecks?.length && locale === "en"
      ? extra.prechecks
      : locale === "zh-Hant" && zh?.prechecks?.length
        ? zh.prechecks
        : [
            locale === "zh-Hant"
              ? `確認 ${s.indicator.monitor_id} 不是過期快照（last_checked 在 2 分鐘內）。`
              : `Confirm ${s.indicator.monitor_id} is not a stale snapshot (last_checked within the last 2 minutes).`,
            locale === "zh-Hant"
              ? "若本技能屬信貸或帳簿風險，確認 LP／報價健康並非獨立違規。"
              : "Confirm LP/feed health is not independently in BREACH if this skill is credit- or book-risk.",
            ...s.related_indicators.slice(0, 4).map((id) =>
              locale === "zh-Hant"
                ? `檢查 ${id} — 若同時告警，視為連結時間鏈，而非單一指標事件。`
                : `Check ${id} — if it is also alarming, treat as a linked timeline, not a single-indicator event.`
            ),
            locale === "zh-Hant"
              ? "呼叫高管前，確認有對應的即時警報／工單。"
              : "Confirm there is a matching live alert / ticket before paging Exec.",
          ]
  );

  const evidence_to_collect = unique(
    extra.evidence_to_collect?.length && locale === "en"
      ? extra.evidence_to_collect
      : locale === "zh-Hant" && zh?.evidence_to_collect?.length
        ? zh.evidence_to_collect
        : [
            locale === "zh-Hant"
              ? `${s.indicator.monitor_id} 監控快照（觀測值 vs 警告 ${warn}／違規 ${breach}）。`
              : `Monitor snapshot for ${s.indicator.monitor_id} (observed vs warn ${warn} / breach ${breach}).`,
            locale === "zh-Hant"
              ? "Messenger 執行緒：ALERT＋AI_REPORT＋任何 ESCALATION 卡片。"
              : "Messenger thread: ALERT + AI_REPORT + any ESCALATION card.",
            locale === "zh-Hant"
              ? "主 RCA；若嚴重度為 BREACH 或 CRITICAL，加上第二 AI 挑戰結論。"
              : "Primary RCA + second-AI challenger verdict if severity is BREACH or CRITICAL.",
            ...s.related_indicators.slice(0, 3).map((id) =>
              locale === "zh-Hant" ? `連動指標 ${id}。` : `Co-moving indicator ${id}.`
            ),
            locale === "zh-Hant"
              ? "任何控制標記為上線前，留下此 alert_id 的稽核／脊柱事件。"
              : "Audit / spine events for this alert_id before any control is marked live.",
          ]
  );

  const stop_conditions = unique(
    extra.stop_conditions?.length && locale === "en"
      ? extra.stop_conditions
      : locale === "zh-Hant" && zh?.stop_conditions?.length
        ? zh.stop_conditions
        : [
            locale === "zh-Hant"
              ? `若 ${s.indicator.monitor_id} 已連續 15 分鐘低於警告 ${warn}，且無連結違規，停止呼叫。`
              : `Stop paging if ${s.indicator.monitor_id} has been back below warn ${warn} for 15 minutes and no linked BREACH remains.`,
            locale === "zh-Hant"
              ? "若第二 AI 判定 DISAGREE 且風險負責人尚未覆寫，停止不可逆控制。"
              : "Stop irreversible controls if the second AI DISAGREEs and Risk Owner has not overridden.",
            locale === "zh-Hant"
              ? "本技能為人工或步驟為 AWAITING_HUMAN 時，中止自動執行。"
              : "Abort auto-execute if this skill is marked manual or a human gate step is AWAITING_HUMAN.",
          ]
  );

  const success_criteria = unique(
    extra.success_criteria?.length && locale === "en"
      ? extra.success_criteria
      : locale === "zh-Hant" && zh?.success_criteria?.length
        ? zh.success_criteria
        : [
            locale === "zh-Hant"
              ? "在下列 SLA 內由具名負責人確認警報。"
              : "Alert acknowledged with a named owner within the SLA below.",
            locale === "zh-Hant"
              ? "劇本步驟完成（或附註明確跳過）並寫入脊柱與稽核。"
              : "Playbook steps completed (or explicitly skipped with a note) in spine + audit.",
            locale === "zh-Hant"
              ? "人工關卡控制已記錄 Maker＋Checker（或風險負責人）。"
              : "Human-gated controls have maker + checker (or Risk Owner) recorded.",
            s.past_cases[0]
              ? locale === "zh-Hant"
                ? `對齊已知良好結果：${s.past_cases[0].case_id} — ${s.past_cases[0].outcome}。`
                : `Look like a known good outcome: ${s.past_cases[0].case_id} — ${s.past_cases[0].outcome}.`
              : locale === "zh-Hant"
                ? "僅在指標恢復健康或剩餘風險被接受後結案。"
                : "Case closed only after indicator is healthy or residual risk is accepted.",
          ]
  );

  const inputs = unique(
    extra.inputs?.length && locale === "en"
      ? extra.inputs
      : [
          locale === "zh-Hant"
            ? `主指標 ${s.indicator.monitor_id}（${indicatorName}），比較 ${cmpZh}，警告 ${warn}，違規 ${breach}。`
            : `Primary indicator ${s.indicator.monitor_id} (${s.indicator.name}), comparator ${cmpEn}, warn ${warn}, breach ${breach}.`,
          locale === "zh-Hant"
            ? `產品 ${s.indicator.product} · 領域 ${s.indicator.domain} · 嚴重度 ${sev}。`
            : `Product ${s.indicator.product} · domain ${s.indicator.domain} · severity ${sev}.`,
          ...s.related_indicators.map((id) =>
            locale === "zh-Hant" ? `相關監控 ${id}` : `Related monitor ${id}`
          ),
        ]
  );

  const outputs = unique(
    extra.outputs?.length && locale === "en"
      ? extra.outputs
      : [
          locale === "zh-Hant"
            ? "Lark／示範 Messenger 通知對應頻道。"
            : "Lark / demo Messenger notify to the mapped channel.",
          locale === "zh-Hant"
            ? "AI 分析包（技能路徑）與證據庫條目。"
            : "AI analysis pack (skill path) plus evidence-vault rows.",
          locale === "zh-Hant"
            ? "脊柱 DETECT → AI_RCA → SKILL_EXECUTE 事件，必要時 INTERVENTION。"
            : "Spine DETECT → AI_RCA → SKILL_EXECUTE events, plus INTERVENTION when gated.",
          s.auto_execute === false
            ? locale === "zh-Hant"
              ? "人工干預佇列項目，等待核准後才上線。"
              : "Human-intervention queue item until approved live."
            : locale === "zh-Hant"
              ? "自動步驟完成紀錄；人工關卡仍需核准。"
              : "Auto-step completion record; human-gated steps still require approval.",
        ]
  );

  const corrections =
    locale === "zh-Hant" && zh?.corrections?.length
      ? s.corrections.map((c, i) => ({
          ...c,
          action: phrase(c.action, locale),
          description: zh.corrections?.[i] || phrase(c.description, locale),
        }))
      : locale === "zh-Hant"
        ? s.corrections.map((c) => ({
            ...c,
            action: phrase(c.action, locale),
            description: phrase(c.description, locale),
          }))
        : s.corrections;

  const steps =
    locale === "zh-Hant" && zh?.steps?.length
      ? s.steps.map((st, i) => ({
          ...st,
          action: phrase(st.action, locale),
          description: zh.steps?.[i] || phrase(st.description, locale),
        }))
      : locale === "zh-Hant"
        ? s.steps.map((st) => ({
            ...st,
            action: phrase(st.action, locale),
            description: phrase(st.description, locale),
          }))
        : s.steps;

  const escalation =
    locale === "zh-Hant"
      ? {
          ...s.escalation,
          path: s.escalation.path.map((h) => ({
            ...h,
            team: phrase(h.team, locale),
            action: phrase(h.action, locale),
          })),
        }
      : s.escalation;

  const past_cases =
    locale === "zh-Hant"
      ? s.past_cases.map((pc) => ({
          ...pc,
          outcome: phrase(pc.outcome, locale),
          summary: phrase(pc.summary, locale),
        }))
      : s.past_cases;

  return {
    ...s,
    name,
    description,
    fault_areas,
    corrections,
    steps,
    past_cases,
    escalation,
    indicator: {
      ...s.indicator,
      name: indicatorName,
      why,
      domain: phrase(s.indicator.domain, locale),
    },
    when_to_use,
    when_not_to_use,
    prechecks,
    evidence_to_collect,
    stop_conditions,
    success_criteria,
    owner_role: extra.owner_role || ownerRole(s.owner_department, locale),
    inputs,
    outputs,
  };
}
