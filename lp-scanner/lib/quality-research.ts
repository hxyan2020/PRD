import { resolveProduct } from "@/lib/products";
import type { Locale, LpRecord, RankedLp } from "@/lib/types";

export type QualityStepStatus = "pending" | "running" | "done" | "warn";

export type QualityStep = {
  id: string;
  index: number;
  title: string;
  action: string;
  result: string;
  details: string[];
  status: QualityStepStatus;
  pros: string[];
  cons: string[];
};

export type QualityReport = {
  mode: "product" | "lp";
  subject: string;
  product?: string;
  locale: Locale;
  generatedAt: string;
  overallScore: number;
  verdict: string;
  summaryPros: string[];
  summaryCons: string[];
  steps: QualityStep[];
  subjects: { name: string; score: number; usedByVantage: boolean }[];
  disclaimer: string;
};

function delayHint(ms: number) {
  return ms;
}

export function buildQualityReport(args: {
  mode: "product" | "lp";
  locale: Locale;
  product?: string;
  lps: LpRecord[];
  rankings?: RankedLp[];
}): QualityReport {
  const { mode, locale, product, lps, rankings } = args;
  const zh = locale === "zh-CN";
  const profile = product ? resolveProduct(product) : null;
  const symbol = profile?.symbol ?? product?.toUpperCase();
  const scoreKey = profile?.scoreKey ?? "fxMajors";
  const session = profile?.session ?? "mixed";

  const subjects =
    mode === "product" && rankings
      ? rankings.slice(0, 5).map((r) => r.lp)
      : lps.slice(0, 1);

  const primary = subjects[0];
  const peers = subjects.slice(1);

  const steps: QualityStep[] = [];

  // 1 Scope
  steps.push({
    id: "scope",
    index: 1,
    title: zh ? "界定测试范围与流量模型" : "Define scope & flow model",
    action: zh
      ? `对照知识库与仓库，确认标的${symbol ? ` ${symbol}` : ""}、时段需求（${session}）及候选 LP 集合。`
      : `Map subject${symbol ? ` ${symbol}` : ""}, session need (${session}) and candidate LP set from repository + KB.`,
    result: zh
      ? `候选 ${subjects.map((s) => s.name).join("、")}；主测对象 ${primary?.name ?? "—"}.`
      : `Candidates: ${subjects.map((s) => s.name).join(", ")}; primary: ${primary?.name ?? "—"}.`,
    details: subjects.map((s) =>
      zh
        ? `${s.name} · ${s.category} · Vantage在用:${s.usedByVantage ? "是" : "否"} · 时段 ${s.hours}`
        : `${s.name} · ${s.category} · Vantage-used:${s.usedByVantage ? "yes" : "no"} · hours ${s.hours}`,
    ),
    status: "done",
    pros: primary
      ? [
          zh
            ? `主测对象产品契合：${primary.bestFor.slice(0, 2).join("、") || primary.category}`
            : `Primary fit: ${primary.bestFor.slice(0, 2).join(", ") || primary.category}`,
        ]
      : [],
    cons: subjects.length < 2
      ? [zh ? "对比样本偏少，建议至少再测 1 家备源" : "Thin peer set — add at least one secondary LP"]
      : [],
  });

  // 2 Executable coverage
  const coverageDetails = subjects.map((s) => {
    const hint = s.scoreHints[scoreKey] ?? 50;
    const offers =
      (symbol &&
        s.products.some(
          (p) => p.toUpperCase().replace(/[\/\s-_]/g, "") === symbol.replace(/[\/\s-_]/g, ""),
        )) ||
      (profile && s.assetClasses.includes(profile.assetClass));
    return zh
      ? `${s.name}: 家族能力分 ${hint}/100；显式覆盖 ${offers ? "是" : "弱/否"}；深度档位代理=定价${s.pricingQuality}/5`
      : `${s.name}: family score ${hint}/100; explicit coverage ${offers ? "yes" : "weak/no"}; depth proxy=pricing ${s.pricingQuality}/5`;
  });
  steps.push({
    id: "coverage",
    index: 2,
    title: zh ? "可成交流动性与深度代理" : "Executable coverage & depth proxy",
    action: zh
      ? "不用营销最优价，而用仓库产品表 + 能力评分 + 定价质量作可成交深度代理（实盘扫单需在 PoC 验证）。"
      : "Prefer executable proxies over marketing TOB: product list + capability score + pricing quality (confirm with live sweeps in PoC).",
    result: coverageDetails[0] ?? (zh ? "无数据" : "No data"),
    details: coverageDetails,
    status: "done",
    pros: primary && (primary.scoreHints[scoreKey] ?? 0) >= 80
      ? [zh ? "主测对象在该品种家族评分高（≥80）" : "Primary scores high on this product family (≥80)"]
      : [],
    cons: primary && (primary.scoreHints[scoreKey] ?? 0) < 60
      ? [zh ? "家族评分偏低，需实盘确认是否可成交" : "Low family score — confirm executability live"]
      : [zh ? "深度为代理指标，非正式盘口档位" : "Depth is a proxy, not live book levels"],
  });

  // 3 Cost & pricing
  steps.push({
    id: "cost",
    index: 3,
    title: zh ? "有效成本与定价质量" : "Effective cost & pricing quality",
    action: zh
      ? "比较成本档、定价质量评级，并提示综合成本=价差+滑点+费用+融资（需 TCA 实盘）。"
      : "Compare cost tier + pricing quality; remind all-in cost = spread + slippage + fees + financing (needs live TCA).",
    result: subjects
      .map((s) => `${s.name}: ${s.costTier} / ${s.pricingQuality}/5`)
      .join(zh ? "；" : "; "),
    details: subjects.map((s) =>
      zh
        ? `${s.name} 成本 ${s.costTier}，定价 ${s.pricingQuality}/5，延迟档 ${s.latencyProfile}`
        : `${s.name} cost ${s.costTier}, pricing ${s.pricingQuality}/5, latency ${s.latencyProfile}`,
    ),
    status: "done",
    pros:
      primary && primary.pricingQuality >= 4
        ? [zh ? "定价质量评级 ≥4/5" : "Pricing quality ≥4/5"]
        : [],
    cons:
      primary && (primary.costTier === "high" || primary.costTier === "negotiated")
        ? [zh ? "成本偏协商/偏高，需按量建模" : "Cost negotiated/high — model at your volume"]
        : [],
  });

  // 4 Session fit
  const hoursFit = (hours: LpRecord["hours"]) => {
    if (session === "24/7") return hours === "24/7" || hours === "mixed";
    if (session === "24/5") return hours === "24/5" || hours === "mixed";
    return true;
  };
  steps.push({
    id: "session",
    index: 4,
    title: zh ? "时段 / 会话匹配" : "Hours / session fit",
    action: zh
      ? `品种会话需求 ${session}；核对各 LP hours 是否匹配（加密需 24/7）。`
      : `Product session need ${session}; check LP hours (crypto needs 24/7).`,
    result: subjects
      .map((s) => `${s.name}: ${s.hours} → ${hoursFit(s.hours) ? (zh ? "匹配" : "fit") : (zh ? "不匹配" : "mismatch")}`)
      .join(zh ? "；" : "; "),
    details: subjects.map((s) =>
      zh
        ? `${s.name} 区域 ${s.regions.slice(0, 4).join("、")}`
        : `${s.name} regions ${s.regions.slice(0, 4).join(", ")}`,
    ),
    status: primary && hoursFit(primary.hours) ? "done" : "warn",
    pros: primary && hoursFit(primary.hours) ? [zh ? "主测对象时段匹配" : "Primary hours fit"] : [],
    cons: primary && !hoursFit(primary.hours)
      ? [zh ? "时段不匹配可能导致假价/拒单" : "Session mismatch risks stale quotes / rejects"]
      : [],
  });

  // 5 Latency / tech
  steps.push({
    id: "latency",
    index: 5,
    title: zh ? "延迟与技术画像" : "Latency & technology profile",
    action: zh
      ? "基于仓库延迟档位评估；建议在目标机房（如 LD4/SG3）测 quote→ack 与 order→fill 的 p95。"
      : "Use repository latency tier; recommend measuring quote→ack and order→fill p95 from your colo (e.g. LD4/SG3).",
    result: subjects.map((s) => `${s.name}: ${s.latencyProfile}`).join(zh ? "；" : "; "),
    details: [
      zh
        ? "技术 PoC 应含 FIX 一致性、断线恢复、drop copy、品种映射。"
        : "Tech PoC should include FIX conformance, reconnect, drop copy, symbol mapping.",
    ],
    status: "done",
    pros:
      primary && (primary.latencyProfile === "ultra-low" || primary.latencyProfile === "low")
        ? [zh ? "延迟档位适合活跃/敏感流量" : "Latency tier suitable for active/sensitive flow"]
        : [],
    cons:
      primary?.category === "technology"
        ? [zh ? "技术层非资产负债表 LP，需叠加真实场所" : "Tech layer is not a balance-sheet LP — pair with venues"]
        : [],
  });

  // 6 Last look / fill policy
  steps.push({
    id: "lastlook",
    index: 6,
    title: zh ? "Last look / 成交与拒单政策" : "Last look / fill & reject policy",
    action: zh
      ? "从知识库弱点与类别推断风险点；要求书面 last look 时长与拒单码，并用受控流实测。"
      : "Infer risk from KB weaknesses/category; demand written last-look windows + reject codes; verify with controlled flow.",
    result: zh
      ? `${primary?.name ?? "LP"}：${primary?.weaknesses[0] ?? "需向 LP 索取订单处理政策"}`
      : `${primary?.name ?? "LP"}: ${primary?.weaknesses[0] ?? "request order-handling policy from LP"}`,
    details: subjects.flatMap((s) =>
      s.weaknesses.slice(0, 2).map((w) => `${s.name}: ${w}`),
    ),
    status: "warn",
    pros: [
      zh
        ? "略宽但可成交的价格往往优于频繁拒单的诱饵盘"
        : "Slightly wider but executable prices often beat teaser quotes that reject",
    ],
    cons: [
      zh
        ? "未实测拒单率前，不得把营销价差当作有效成本"
        : "Do not treat marketing spreads as effective cost until reject rates are measured",
    ],
  });

  // 7 Stress readiness
  steps.push({
    id: "stress",
    index: 7,
    title: zh ? "压力与新闻窗口就绪度" : "Stress / news-window readiness",
    action: zh
      ? "规划 NFP/央行、开盘、展期、清淡亚太、加密周末等窗口；对比平静市 vs 压力市有效成本。"
      : "Plan NFP/CB, opens, rollover, thin Asia, crypto weekend windows; compare quiet vs stress effective cost.",
    result: zh
      ? `主测 ${primary?.name} 建议压力清单已生成；同业对照 ${peers.map((p) => p.name).join("、") || "无"}。`
      : `Stress checklist generated for ${primary?.name}; peers ${peers.map((p) => p.name).join(", ") || "none"}.`,
    details: zh
      ? [
          "非农 / 央行决议时段：记录拒单与滑点对称性",
          "开盘与展期：观察价差跳变与冻结时长",
          "清淡时段：检查报价空洞与陈旧 tick",
          symbol?.includes("BTC") || primary?.category === "crypto"
            ? "加密：周末跳空与 24/7 深度"
            : "传统品种：24/5 收市前后流动性塌陷",
        ]
      : [
          "NFP / CB windows: log rejects + slippage symmetry",
          "Opens & rollover: spread jumps and freeze duration",
          "Thin sessions: quote gaps / stale ticks",
          symbol?.includes("BTC") || primary?.category === "crypto"
            ? "Crypto: weekend gaps + 24/7 depth"
            : "Traditional: liquidity collapse around 24/5 closes",
        ],
    status: "done",
    pros: primary?.usedByVantage
      ? [zh ? "Vantage 在用路径已知，压力事故可对照历史" : "Known Vantage path — can compare to historical incidents"]
      : [],
    cons: [
      zh
        ? "本步骤为计划性评估，非实盘压力成交结果"
        : "This step is a planned assessment, not live stress fill results",
    ],
  });

  // 8 Counterparty
  steps.push({
    id: "counterparty",
    index: 8,
    title: zh ? "对手方、监管与授信" : "Counterparty, regulation & credit",
    action: zh
      ? "核对监管标签、区域、授信/协商成本提示；签约前核实法律实体与牌照登记。"
      : "Check regulation tags, regions, credit/negotiated-cost hints; verify legal entity + licence register before contracting.",
    result: primary
      ? zh
        ? `${primary.name} 监管：${primary.regulation.join("、") || "未核实"}；区域：${primary.regions.join("、")}`
        : `${primary.name} regulation: ${primary.regulation.join(", ") || "unverified"}; regions: ${primary.regions.join(", ")}`
      : "—",
    details: subjects.map((s) =>
      zh
        ? `${s.name}: ${(s.regulation.length ? s.regulation : ["Unverified"]).join("、")}`
        : `${s.name}: ${(s.regulation.length ? s.regulation : ["Unverified"]).join(", ")}`,
    ),
    status: primary?.regulation.some((r) => /unverified/i.test(r)) ? "warn" : "done",
    pros: primary && primary.regulation.length > 0 && !primary.regulation.some((r) => /unverified/i.test(r))
      ? [zh ? "仓库中有明确监管标签" : "Clear regulation tags in repository"]
      : [],
    cons: [
      zh
        ? "品牌 ≠ 签约实体；授信与隔离条款需法务/财务确认"
        : "Brand ≠ contracting entity; credit/segregation needs legal/finance sign-off",
    ],
  });

  // 9 Pros cons synthesis
  const summaryPros = [
    ...(primary?.strengths.slice(0, 3) ?? []),
    ...(primary?.usedByVantage
      ? [zh ? "已标记 Vantage 在用，集成路径熟悉" : "Marked used by Vantage — known integration path"]
      : []),
  ];
  const summaryCons = [
    ...(primary?.weaknesses.slice(0, 3) ?? []),
    ...(primary && !hoursFit(primary.hours)
      ? [zh ? "与标的会话时段不完全匹配" : "Incomplete session match for the product"]
      : []),
  ];
  steps.push({
    id: "proscons",
    index: 9,
    title: zh ? "优势 / 局限综合" : "Pros / cons synthesis",
    action: zh
      ? "汇总知识库优势/局限 + 本轮度量代理结果，突出对交易台决策有用的对比点。"
      : "Merge KB strengths/weaknesses with this run’s proxy metrics for desk-useful contrast.",
    result: zh
      ? `优势 ${summaryPros.length} 条，局限 ${summaryCons.length} 条（见报告）。`
      : `${summaryPros.length} pros, ${summaryCons.length} cons (see report).`,
    details: [
      ...summaryPros.map((p) => (zh ? `优势: ${p}` : `Pro: ${p}`)),
      ...summaryCons.map((c) => (zh ? `局限: ${c}` : `Con: ${c}`)),
    ],
    status: "done",
    pros: summaryPros.slice(0, 4),
    cons: summaryCons.slice(0, 4),
  });

  // 10 Verdict
  const overall = primary
    ? Math.max(
        0,
        Math.min(
          100,
          Math.round(
            (primary.scoreHints[scoreKey] ?? 50) * 0.45 +
              primary.pricingQuality * 6 +
              (hoursFit(primary.hours) ? 8 : -10) +
              (primary.usedByVantage ? 6 : 0) +
              ({ "ultra-low": 6, low: 4, medium: 2 }[primary.latencyProfile] ?? 0),
          ),
        ),
      )
    : 0;

  const verdict = zh
    ? overall >= 85
      ? `${primary?.name} 对本标的呈现高优先级候选：建议进入受控 PoC（真实单量扫单 + 新闻窗）。`
      : overall >= 65
        ? `${primary?.name} 可作为可用候选：先补 last look/拒单实测，再与备源对比有效成本。`
        : `${primary?.name} 目前代理评分偏低：仅作探索；优先验证覆盖与时段，或换更高分备源。`
    : overall >= 85
      ? `${primary?.name} looks high-priority for this subject — proceed to controlled PoC (size sweeps + news windows).`
      : overall >= 65
        ? `${primary?.name} is a usable candidate — measure last-look/rejects, then compare all-in cost vs secondary.`
        : `${primary?.name} scores soft on proxies — exploratory only; verify coverage/hours or prefer a higher-scoring peer.`;

  steps.push({
    id: "verdict",
    index: 10,
    title: zh ? "结论与下一步 PoC" : "Verdict & next PoC steps",
    action: zh
      ? "给出综合代理评分与可执行下一步（FIX 实验室 → 准生产 PoC → 月度监控）。"
      : "Issue composite proxy score and actionable next steps (FIX lab → PoC → monthly monitoring).",
    result: verdict,
    details: zh
      ? [
          `综合代理分：${overall}/100`,
          "下一步 1：FIX MD/OE + 目标机房延迟",
          "下一步 2：按 1×/5×/20× 平均单量扫单",
          "下一步 3：新闻窗滑点对称与拒单码分类",
          "下一步 4：平台↔桥↔LP 对账与故障切换演练",
        ]
      : [
          `Composite proxy score: ${overall}/100`,
          "Next 1: FIX MD/OE + colo latency",
          "Next 2: Sweep at 1×/5×/20× average ticket",
          "Next 3: News-window slippage symmetry + reject codes",
          "Next 4: Platform↔bridge↔LP reconcile + failover drill",
        ],
    status: overall >= 65 ? "done" : "warn",
    pros: overall >= 65 ? [zh ? "值得进入 PoC 预算" : "Worth a PoC budget"] : [],
    cons: overall < 65 ? [zh ? "不宜直接加大生产流量" : "Do not ramp production flow yet"] : [],
  });

  return {
    mode,
    subject: primary?.name ?? (mode === "product" ? symbol ?? "—" : "—"),
    product: symbol,
    locale,
    generatedAt: new Date().toISOString(),
    overallScore: overall,
    verdict,
    summaryPros,
    summaryCons,
    steps,
    subjects: subjects.map((s) => ({
      name: s.name,
      score: Math.round((s.scoreHints[scoreKey] ?? 50) + s.pricingQuality * 5),
      usedByVantage: s.usedByVantage,
    })),
    disclaimer: zh
      ? "本报告为知识库 + 启发式实时研究代理结果，不能替代实盘 TCA、牌照法律意见或授信审批。标注为样本/代理处需在 PoC 中验证。"
      : "This report combines KB + heuristic live-research proxies. It does not replace live TCA, legal licence opinions, or credit approval. Items marked proxy/sample must be verified in PoC.",
  };
}

export function stepDelayMs(index: number): number {
  // Stagger for realtime UX
  return delayHint(450 + index * 180);
}

export function buildPrintableHtml(report: QualityReport): string {
  const zh = report.locale === "zh-CN";
  const when = new Date(report.generatedAt).toLocaleString(zh ? "zh-CN" : "en-SG", {
    timeZone: "Asia/Singapore",
  });
  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  const stepsHtml = report.steps
    .map(
      (s) => `
      <section class="step">
        <h3>${s.index}. ${esc(s.title)} <span class="badge">${esc(s.status)}</span></h3>
        <p><strong>${zh ? "动作" : "Action"}:</strong> ${esc(s.action)}</p>
        <p><strong>${zh ? "结果" : "Result"}:</strong> ${esc(s.result)}</p>
        <ul>${s.details.map((d) => `<li>${esc(d)}</li>`).join("")}</ul>
        <div class="pc">
          <div><h4>${zh ? "优势" : "Pros"}</h4><ul>${s.pros.map((p) => `<li>${esc(p)}</li>`).join("") || `<li>—</li>`}</ul></div>
          <div><h4>${zh ? "局限" : "Cons"}</h4><ul>${s.cons.map((c) => `<li>${esc(c)}</li>`).join("") || `<li>—</li>`}</ul></div>
        </div>
      </section>`,
    )
    .join("\n");

  return `<!DOCTYPE html>
<html lang="${report.locale}">
<head>
<meta charset="utf-8"/>
<title>LP Quality Research — ${esc(report.subject)}</title>
<style>
  @page { margin: 16mm; }
  body { font-family: "Source Serif 4", Georgia, "Noto Serif SC", serif; color: #0b1f33; line-height: 1.45; }
  h1 { font-size: 28px; margin: 0 0 6px; }
  h2 { font-size: 18px; margin-top: 22px; border-bottom: 1px solid #c5d0db; padding-bottom: 4px; }
  h3 { font-size: 15px; margin-bottom: 6px; }
  h4 { font-size: 13px; margin: 0 0 4px; color: #0f766e; }
  .meta { color: #5a6b7c; font-size: 12px; }
  .verdict { background: #f4f7fa; border: 1px solid #c5d0db; padding: 12px 14px; border-radius: 8px; }
  .score { font-size: 22px; color: #0f766e; font-weight: 700; }
  .pc { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .pc div { background: #f8fafc; border-radius: 6px; padding: 8px 10px; }
  .step { break-inside: avoid; margin: 14px 0; padding-bottom: 10px; border-bottom: 1px dashed #d7e0ea; }
  .badge { font-size: 11px; color: #0f766e; font-weight: 600; text-transform: uppercase; }
  ul { margin: 6px 0 0 18px; padding: 0; }
  li { margin: 2px 0; font-size: 13px; }
  .disclaimer { font-size: 11px; color: #5a6b7c; margin-top: 24px; }
  @media print { .no-print { display: none; } a { color: inherit; text-decoration: none; } }
</style>
</head>
<body>
  <button class="no-print" onclick="window.print()" style="margin-bottom:12px;padding:8px 12px;">${zh ? "打印 / 另存为 PDF" : "Print / Save as PDF"}</button>
  <h1>LP Scanner — ${zh ? "流动性质量研究报告" : "Liquidity Quality Research Report"}</h1>
  <p class="meta">${zh ? "对象" : "Subject"}: <strong>${esc(report.subject)}</strong>
    ${report.product ? ` · ${zh ? "品种" : "Product"}: ${esc(report.product)}` : ""}
    · ${zh ? "模式" : "Mode"}: ${report.mode}
    · ${when} (SGT)</p>
  <p class="score">${zh ? "综合代理分" : "Composite proxy score"}: ${report.overallScore}/100</p>
  <div class="verdict"><strong>${zh ? "结论" : "Verdict"}:</strong> ${esc(report.verdict)}</div>

  <h2>${zh ? "总览优势 / 局限" : "Summary pros / cons"}</h2>
  <div class="pc">
    <div><h4>${zh ? "优势" : "Pros"}</h4><ul>${report.summaryPros.map((p) => `<li>${esc(p)}</li>`).join("") || "<li>—</li>"}</ul></div>
    <div><h4>${zh ? "局限" : "Cons"}</h4><ul>${report.summaryCons.map((c) => `<li>${esc(c)}</li>`).join("") || "<li>—</li>"}</ul></div>
  </div>

  <h2>${zh ? "对照对象" : "Subjects compared"}</h2>
  <ul>${report.subjects.map((s) => `<li>${esc(s.name)} — score ${s.score}${s.usedByVantage ? (zh ? " · Vantage在用" : " · Vantage-used") : ""}</li>`).join("")}</ul>

  <h2>${zh ? "分步研究记录" : "Step-by-step research log"}</h2>
  ${stepsHtml}

  <p class="disclaimer">${esc(report.disclaimer)}</p>
  <script>window.addEventListener('load',()=>{ /* ready for print */ });</script>
</body>
</html>`;
}
