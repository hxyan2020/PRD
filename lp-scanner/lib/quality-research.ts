import { localizedLpLists } from "@/lib/i18n/lp-display";
import { formatOptimalRegions, resolveOptimalRegions } from "@/lib/regions";
import { resolveProduct, type ProductProfile } from "@/lib/products";
import type { Locale, LpRecord, RankedLp } from "@/lib/types";
import { dateLocale, isZh } from "@/lib/i18n/locale";

export type QualityStepStatus = "pending" | "running" | "done" | "warn";

/** Product-fit traffic light for proxy quality scores (0–100). */
export type ScoreBand = "green" | "yellow" | "red";

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

export type DataBottleneck = {
  hit: boolean;
  message: string;
  gaps: string[];
};

export type QualitySubjectScore = {
  name: string;
  slug: string;
  score: number;
  band: ScoreBand;
  usedByVantage: boolean;
  logoUrl?: string;
  offersProduct: boolean;
  /** Short product-fit reason from ranking/KB. */
  reason?: string;
};

export type QualityReport = {
  mode: "product" | "lp";
  subject: string;
  product?: string;
  locale: Locale;
  generatedAt: string;
  overallScore: number;
  overallBand: ScoreBand;
  verdict: string;
  summaryPros: string[];
  summaryCons: string[];
  steps: QualityStep[];
  subjects: QualitySubjectScore[];
  dataBottleneck: DataBottleneck;
  /** Extra findings from KB ranking + optional live public lookup. */
  liveFindings: string[];
  disclaimer: string;
};

export function scoreBand(score: number): ScoreBand {
  if (score >= 85) return "green";
  if (score >= 65) return "yellow";
  return "red";
}

export function scoreBandLabel(band: ScoreBand, locale: Locale): string {
  if (locale === "zh-TW") {
    return band === "green" ? "綠 · 高適配" : band === "yellow" ? "黃 · 可候選" : "紅 · 偏弱";
  }
  if (locale === "zh-CN") {
    return band === "green" ? "绿 · 高适配" : band === "yellow" ? "黄 · 可候选" : "红 · 偏弱";
  }
  return band === "green" ? "Green · strong fit" : band === "yellow" ? "Yellow · usable" : "Red · weak fit";
}

function hoursFitForSession(hours: LpRecord["hours"], session: string): boolean {
  if (session === "24/7") return hours === "24/7" || hours === "mixed";
  if (session === "24/5") return hours === "24/5" || hours === "mixed";
  return true;
}

function offersSymbol(
  lp: LpRecord,
  symbol?: string,
  assetClass?: string,
): boolean {
  if (
    symbol &&
    lp.products.some(
      (p) =>
        p.toUpperCase().replace(/[\/\s-_]/g, "") ===
        symbol.replace(/[\/\s-_]/g, ""),
    )
  ) {
    return true;
  }
  if (assetClass && lp.assetClasses.includes(assetClass as LpRecord["assetClasses"][number])) {
    return true;
  }
  return false;
}

/** Product-relative proxy quality score clamped to 0–100. */
export function computeLpProductScore(
  lp: LpRecord,
  opts: {
    scoreKey: keyof LpRecord["scoreHints"];
    session: string;
    symbol?: string;
    assetClass?: string;
  },
): number {
  const offers = offersSymbol(lp, opts.symbol, opts.assetClass);
  const fit = hoursFitForSession(lp.hours, opts.session);
  return Math.max(
    0,
    Math.min(
      100,
      Math.round(
        (lp.scoreHints[opts.scoreKey] ?? 50) * 0.45 +
          lp.pricingQuality * 6 +
          (fit ? 8 : -10) +
          (lp.usedByVantage ? 6 : 0) +
          ({ "ultra-low": 6, low: 4, medium: 2 }[lp.latencyProfile] ?? 0) +
          (offers ? 8 : -12),
      ),
    ),
  );
}

/** Infer score family when LP quality is run without an explicit product. */
export function inferScoreContext(lp?: LpRecord, product?: string): {
  profile: ProductProfile | null;
  symbol?: string;
  scoreKey: keyof LpRecord["scoreHints"];
  session: string;
  assetClass?: string;
} {
  if (product) {
    const profile = resolveProduct(product);
    return {
      profile,
      symbol: profile?.symbol ?? product.toUpperCase(),
      scoreKey: profile?.scoreKey ?? "fxMajors",
      session: profile?.session ?? "mixed",
      assetClass: profile?.assetClass,
    };
  }
  if (!lp) {
    return { profile: null, scoreKey: "fxMajors", session: "mixed" };
  }
  if (lp.category === "crypto" || lp.assetClasses.includes("crypto")) {
    return {
      profile: resolveProduct("BTCUSD"),
      symbol: "BTCUSD",
      scoreKey: "crypto",
      session: "24/7",
      assetClass: "crypto",
    };
  }
  if (lp.scoreHints.gold >= 75 && lp.scoreHints.gold >= lp.scoreHints.fxMajors) {
    return {
      profile: resolveProduct("XAUUSD"),
      symbol: "XAUUSD",
      scoreKey: "gold",
      session: "24/5",
      assetClass: "metals",
    };
  }
  return {
    profile: null,
    scoreKey: "fxMajors",
    session: lp.hours === "24/7" ? "24/7" : "24/5",
    assetClass: lp.assetClasses[0],
  };
}

/** Critical inputs needed for a firm LP quality call that this scanner may lack. */
export function assessDataAvailability(args: {
  locale: Locale;
  primary?: LpRecord;
  subjects: LpRecord[];
  symbol?: string;
  scoreKey: keyof LpRecord["scoreHints"];
  profileAssetClass?: string;
}): DataBottleneck {
  const { locale, primary, subjects, symbol, scoreKey, profileAssetClass } = args;
  const zh = isZh(locale);
  const gaps: string[] = [];

  // Live market / fill telemetry is never available in this app — always a structural gap.
  gaps.push(
    zh
      ? "无实时 FIX 盘口 / 可成交深度 / TCA 成交样本（仅有知识库与仓库代理）"
      : "No live FIX book / executable depth / TCA fill sample (KB + repository proxies only)",
  );
  gaps.push(
    zh
      ? "无 last look 时长、拒单率与拒单码实测"
      : "No measured last-look window, reject rate, or reject-code telemetry",
  );
  gaps.push(
    zh
      ? "无新闻窗 / 压力市实盘滑点与成交结果"
      : "No live news-window / stress-session fill & slippage results",
  );

  if (subjects.length < 2) {
    gaps.push(
      zh ? "对比样本不足（缺少备源 LP）" : "Peer comparison set too thin (no secondary LP)",
    );
  }

  if (primary) {
    const offers =
      (symbol &&
        primary.products.some(
          (p) =>
            p.toUpperCase().replace(/[\/\s-_]/g, "") ===
            symbol.replace(/[\/\s-_]/g, ""),
        )) ||
      (profileAssetClass && primary.assetClasses.includes(profileAssetClass as LpRecord["assetClasses"][number]));
    if (!offers) {
      gaps.push(
        zh
          ? `仓库未明确覆盖标的 ${symbol ?? "—"}，可成交性无法从现有数据确认`
          : `Repository has no explicit coverage for ${symbol ?? "—"} — executability cannot be confirmed from available data`,
      );
    }

    const hint = primary.scoreHints[scoreKey];
    if (hint == null || hint < 55) {
      gaps.push(
        zh
          ? "该品种家族能力分缺失或偏低，深度/覆盖判断证据不足"
          : "Family capability score missing or soft — weak evidence for depth/coverage judgment",
      );
    }

    if (localizedLpLists(primary, locale).weaknesses.length === 0) {
      gaps.push(
        zh
          ? "知识库缺少已知局限/订单处理政策线索"
          : "KB lacks documented weaknesses / order-handling policy clues",
      );
    }

    if (
      primary.regulation.length === 0 ||
      primary.regulation.some((r) => /unverified/i.test(r))
    ) {
      gaps.push(
        zh
          ? "监管/法律实体标签未核实，授信评估缺数据"
          : "Regulation / legal-entity tags unverified — credit assessment lacks data",
      );
    }

    if (!primary.kbBodyEn?.trim() && !primary.kbBodyZh?.trim() && !primary.notes?.trim()) {
      gaps.push(
        zh ? "LP 档案正文几乎为空" : "LP profile body is nearly empty",
      );
    }
  } else {
    gaps.push(zh ? "未找到可评估的主测 LP" : "No primary LP subject available to assess");
  }

  // Bottleneck when live telemetry is missing AND at least one subject-specific gap,
  // or when we have no primary — i.e. data availability blocks a firm quality call.
  const subjectSpecific = gaps.length > 3; // first 3 are always the live-data gaps
  const hit = !primary || subjectSpecific || gaps.length >= 3;

  const message = hit
    ? zh
      ? `数据可得性是瓶颈：在补齐实盘 TCA / 拒单 / 压力窗样本之前，无法给出确定的 LP 质量结论。缺口：${gaps.slice(0, 4).join("；")}${gaps.length > 4 ? "…" : ""}`
      : `Data availability is the bottleneck: a definitive LP quality call is blocked until live TCA / rejects / stress-window samples exist. Gaps: ${gaps.slice(0, 4).join("; ")}${gaps.length > 4 ? "…" : ""}`
    : zh
      ? "当前代理数据足以做探索性排序，但仍非实盘质量证明。"
      : "Proxy data is enough for exploratory ranking, not a live quality proof.";

  return { hit, message, gaps };
}

function delayHint(ms: number) {
  return ms;
}

export function buildQualityReport(args: {
  mode: "product" | "lp";
  locale: Locale;
  product?: string;
  lps: LpRecord[];
  rankings?: RankedLp[];
  /** Optional live public findings (Wikipedia/DDG etc.) already fetched by the API. */
  liveFindings?: string[];
}): QualityReport {
  const { mode, locale, product, lps, rankings, liveFindings: incomingLive = [] } = args;
  const zh = isZh(locale);

  const subjects =
    mode === "product" && rankings
      ? rankings.slice(0, 5).map((r) => r.lp)
      : mode === "lp"
        ? lps.slice(0, 5)
        : lps.slice(0, 1);

  const primary = subjects[0];
  const peers = subjects.slice(1);

  const ctx = inferScoreContext(primary, product);
  const profile = ctx.profile;
  const symbol = ctx.symbol;
  const scoreKey = ctx.scoreKey;
  const session = ctx.session;

  const rankById = new Map((rankings ?? []).map((r) => [r.lp.id, r]));

  const subjectScores: QualitySubjectScore[] = subjects.map((s) => {
    const score = computeLpProductScore(s, {
      scoreKey,
      session,
      symbol,
      assetClass: ctx.assetClass ?? profile?.assetClass,
    });
    const ranked = rankById.get(s.id);
    return {
      name: s.name,
      slug: s.slug,
      logoUrl: s.logoUrl,
      score,
      band: scoreBand(score),
      usedByVantage: s.usedByVantage,
      offersProduct: ranked?.offersProduct ?? offersSymbol(s, symbol, ctx.assetClass ?? profile?.assetClass),
      reason: ranked?.reasons[0] ?? ranked?.liveNotes[0],
    };
  });

  const dataBottleneck = assessDataAvailability({
    locale,
    primary,
    subjects,
    symbol,
    scoreKey,
    profileAssetClass: ctx.assetClass ?? profile?.assetClass,
  });

  const kbLiveNotes = (rankings ?? [])
    .slice(0, 3)
    .flatMap((r) => r.liveNotes.slice(0, 2).map((n) => `${r.lp.name}: ${n}`));
  const liveFindings = [...incomingLive, ...kbLiveNotes].slice(0, 8);

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
    status: subjects.length < 2 ? "warn" : "done",
    pros: primary
      ? [
          zh
            ? `主测对象产品契合：${localizedLpLists(primary, locale).bestFor.slice(0, 2).join("、") || primary.category}`
            : `Primary fit: ${localizedLpLists(primary, locale).bestFor.slice(0, 2).join(", ") || primary.category}`,
        ]
      : [],
    cons: subjects.length < 2
      ? [zh ? "对比样本偏少，建议至少再测 1 家备源" : "Thin peer set — add at least one secondary LP"]
      : [],
  });

  // 1b Data availability gate
  steps.push({
    id: "data",
    index: 2,
    title: zh ? "数据可得性检查" : "Data availability check",
    action: zh
      ? "核对本轮能否拿到实盘盘口、TCA、拒单与压力窗样本；缺什么就明确说是瓶颈。"
      : "Check whether live book, TCA, reject and stress-window samples are available; name the bottleneck when they are not.",
    result: dataBottleneck.hit
      ? zh
        ? "已命中：数据可得性是瓶颈。"
        : "Hit: data availability is the bottleneck."
      : zh
        ? "代理数据可用；仍需 PoC 验证。"
        : "Proxy data usable; PoC still required.",
    details: dataBottleneck.gaps,
    status: dataBottleneck.hit ? "warn" : "done",
    pros: dataBottleneck.hit
      ? []
      : [zh ? "仓库/知识库足以做探索性排序" : "Repository/KB enough for exploratory ranking"],
    cons: dataBottleneck.hit
      ? [
          zh
            ? "数据可得性是瓶颈 — 在补齐实盘样本前，质量结论只能是代理分"
            : "Data availability is the bottleneck — quality verdict stays proxy-only until live samples exist",
          ...dataBottleneck.gaps.slice(0, 3),
        ]
      : dataBottleneck.gaps.slice(0, 2),
  });

  // 2 Executable coverage — use actual repository product lists + family scores
  const coverageDetails = subjects.map((s) => {
    const hint = s.scoreHints[scoreKey] ?? 50;
    const scored = subjectScores.find((x) => x.slug === s.slug);
    const offers = scored?.offersProduct ?? offersSymbol(s, symbol, ctx.assetClass ?? profile?.assetClass);
    return zh
      ? `${s.name}: 相对 ${symbol ?? "—"} 代理分 ${scored?.score ?? "—"}/100（${scoreBandLabel(scored?.band ?? "red", locale)}）；家族能力 ${hint}/100；显式覆盖 ${offers ? "是" : "弱/否"}；定价 ${s.pricingQuality}/5`
      : `${s.name}: ${symbol ?? "—"} proxy ${scored?.score ?? "—"}/100 (${scoreBandLabel(scored?.band ?? "red", locale)}); family ${hint}/100; explicit coverage ${offers ? "yes" : "weak/no"}; pricing ${s.pricingQuality}/5`;
  });
  const coverageBlocked =
    dataBottleneck.gaps.some((g) =>
      /FIX|depth|TCA|覆盖|coverage|executab/i.test(g),
    );
  steps.push({
    id: "coverage",
    index: 3,
    title: zh ? "可成交流动性与深度代理" : "Executable coverage & depth proxy",
    action: zh
      ? "不用营销最优价，而用仓库产品表 + 能力评分 + 定价质量作可成交深度代理（实盘扫单需在 PoC 验证）。"
      : "Prefer executable proxies over marketing TOB: product list + capability score + pricing quality (confirm with live sweeps in PoC).",
    result: coverageDetails[0] ?? (zh ? "无数据" : "No data"),
    details: coverageDetails,
    status: coverageBlocked ? "warn" : "done",
    pros: primary && (primary.scoreHints[scoreKey] ?? 0) >= 80
      ? [zh ? "主测对象在该品种家族评分高（≥80）" : "Primary scores high on this product family (≥80)"]
      : [],
    cons: [
      ...(primary && (primary.scoreHints[scoreKey] ?? 0) < 60
        ? [zh ? "家族评分偏低，需实盘确认是否可成交" : "Low family score — confirm executability live"]
        : [zh ? "深度为代理指标，非正式盘口档位" : "Depth is a proxy, not live book levels"]),
      ...(coverageBlocked
        ? [
            zh
              ? "数据可得性瓶颈：无实盘档位/扫单样本，本步不能当作质量定论"
              : "Data-availability bottleneck: no live book/sweep sample — this step is not a quality proof",
          ]
        : []),
    ],
  });

  // 4 Cost & pricing
  steps.push({
    id: "cost",
    index: 4,
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
    cons: [
      ...(primary && (primary.costTier === "high" || primary.costTier === "negotiated")
        ? [zh ? "成本偏协商/偏高，需按量建模" : "Cost negotiated/high — model at your volume"]
        : []),
      ...(dataBottleneck.hit
        ? [
            zh
              ? "数据可得性瓶颈：无 TCA 样本，有效成本无法证实"
              : "Data-availability bottleneck: no TCA sample — effective cost unproven",
          ]
        : []),
    ],
  });

  // 5 Session fit
  steps.push({
    id: "session",
    index: 5,
    title: zh ? "时段 / 会话匹配" : "Hours / session fit",
    action: zh
      ? `品种会话需求 ${session}；核对各 LP hours 是否匹配（加密需 24/7）。`
      : `Product session need ${session}; check LP hours (crypto needs 24/7).`,
    result: subjects
      .map(
        (s) =>
          `${s.name}: ${s.hours} → ${
            hoursFitForSession(s.hours, session)
              ? zh
                ? "匹配"
                : "fit"
              : zh
                ? "不匹配"
                : "mismatch"
          }`,
      )
      .join(zh ? "；" : "; "),
    details: subjects.map((s) => {
      const optimal = formatOptimalRegions(resolveOptimalRegions(s.slug, s.optimalRegions), locale);
      return zh
        ? `${s.name} 足迹 ${s.regions.slice(0, 4).join("、")} · 最优区域 ${optimal}`
        : `${s.name} footprint ${s.regions.slice(0, 4).join(", ")} · optimal ${optimal}`;
    }),
    status: primary && hoursFitForSession(primary.hours, session) ? "done" : "warn",
    pros:
      primary && hoursFitForSession(primary.hours, session)
        ? [zh ? "主测对象时段匹配" : "Primary hours fit"]
        : [],
    cons:
      primary && !hoursFitForSession(primary.hours, session)
        ? [zh ? "时段不匹配可能导致假价/拒单" : "Session mismatch risks stale quotes / rejects"]
        : [],
  });

  // 6 Latency / tech
  steps.push({
    id: "latency",
    index: 6,
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

  // 7 Last look / fill policy
  steps.push({
    id: "lastlook",
    index: 7,
    title: zh ? "Last look / 成交与拒单政策" : "Last look / fill & reject policy",
    action: zh
      ? "从知识库弱点与类别推断风险点；要求书面 last look 时长与拒单码，并用受控流实测。"
      : "Infer risk from KB weaknesses/category; demand written last-look windows + reject codes; verify with controlled flow.",
    result: zh
      ? `${primary?.name ?? "LP"}：${(primary ? localizedLpLists(primary, locale).weaknesses[0] : undefined) ?? "需向 LP 索取订单处理政策"} · 数据可得性瓶颈：无拒单实测`
      : `${primary?.name ?? "LP"}: ${(primary ? localizedLpLists(primary, locale).weaknesses[0] : undefined) ?? "request order-handling policy from LP"} · data-availability bottleneck: no reject telemetry`,
    details: [
      ...subjects.flatMap((s) =>
        localizedLpLists(s, locale).weaknesses.slice(0, 2).map((w) => `${s.name}: ${w}`),
      ),
      zh
        ? "已命中数据可得性瓶颈：缺少 last look / 拒单码实测，本步不能定论"
        : "Hit data-availability bottleneck: missing last-look / reject-code measurements — cannot conclude this step",
    ],
    status: "warn",
    pros: [
      zh
        ? "略宽但可成交的价格往往优于频繁拒单的诱饵盘"
        : "Slightly wider but executable prices often beat teaser quotes that reject",
    ],
    cons: [
      zh
        ? "数据可得性是瓶颈：未实测拒单率前，不得把营销价差当作有效成本"
        : "Data availability is the bottleneck: do not treat marketing spreads as effective cost until reject rates are measured",
    ],
  });

  // 8 Stress readiness
  steps.push({
    id: "stress",
    index: 8,
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
    status: "warn",
    pros: primary?.usedByVantage
      ? [zh ? "Vantage 在用路径已知，压力事故可对照历史" : "Known Vantage path — can compare to historical incidents"]
      : [],
    cons: [
      zh
        ? "数据可得性是瓶颈：本步骤为计划性评估，非实盘压力成交结果"
        : "Data availability is the bottleneck: this step is a planned assessment, not live stress fill results",
    ],
  });

  // 9 Counterparty
  steps.push({
    id: "counterparty",
    index: 9,
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

  // 10 Pros cons synthesis
  const primaryLists = primary ? localizedLpLists(primary, locale) : null;
  const summaryPros = [
    ...(primaryLists?.strengths.slice(0, 3) ?? []),
    ...(primary?.usedByVantage
      ? [zh ? "已标记 Vantage 在用，集成路径熟悉" : "Marked used by Vantage — known integration path"]
      : []),
  ];
  const summaryCons = [
    ...(dataBottleneck.hit
      ? [
          zh
            ? "数据可得性是瓶颈 — 缺实盘 TCA / 拒单 / 压力窗样本"
            : "Data availability is the bottleneck — missing live TCA / rejects / stress-window samples",
        ]
      : []),
    ...(primaryLists?.weaknesses.slice(0, 3) ?? []),
    ...(primary && !hoursFitForSession(primary.hours, session)
      ? [zh ? "与标的会话时段不完全匹配" : "Incomplete session match for the product"]
      : []),
  ];
  steps.push({
    id: "proscons",
    index: 10,
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
      ...liveFindings.slice(0, 3).map((f) => (zh ? `实据: ${f}` : `Evidence: ${f}`)),
    ],
    status: "done",
    pros: summaryPros.slice(0, 4),
    cons: summaryCons.slice(0, 4),
  });

  // 11 Verdict — product-relative score with traffic-light band
  const overall = subjectScores[0]?.score ?? 0;
  const overallBand = scoreBand(overall);
  const bandLabel = scoreBandLabel(overallBand, locale);

  const baseVerdict = zh
    ? overallBand === "green"
      ? `${primary?.name} 对 ${symbol ?? "标的"} 呈绿色高适配（${overall}/100）：按最终方法论进入「影子行情 → 小额实盘」（已接入 LP 可跳过完整 UAT）；新闻窗扫单必做。`
      : overallBand === "yellow"
        ? `${primary?.name} 对 ${symbol ?? "标的"} 呈黄色可候选（${overall}/100）：补历史回测异常规则 + 真实行情影子，再测 last look/拒单与有效成本。`
        : `${primary?.name} 对 ${symbol ?? "标的"} 呈红色偏弱（${overall}/100）：仅作探索；优先验证覆盖与时段，或换更高分备源。`
    : overallBand === "green"
      ? `${primary?.name} is green / strong fit for ${symbol ?? "this product"} (${overall}/100) — follow final methodology: live quote shadow → small live fills (skip full UAT if LP already connected); include news-window sweeps.`
      : overallBand === "yellow"
        ? `${primary?.name} is yellow / usable for ${symbol ?? "this product"} (${overall}/100) — add historical anomaly backtest + live MD shadow, then measure last-look/rejects and all-in cost.`
        : `${primary?.name} is red / weak fit for ${symbol ?? "this product"} (${overall}/100) — exploratory only; verify coverage/hours or prefer a higher-scoring peer.`;

  const verdict = dataBottleneck.hit
    ? zh
      ? `数据可得性是瓶颈。${baseVerdict} 在获得实盘 TCA / 拒单 / 压力窗样本前，请将 ${overall}/100（${bandLabel}）仅视为相对该品种的代理分，不作生产定论。`
      : `Data availability is the bottleneck. ${baseVerdict} Treat ${overall}/100 (${bandLabel}) as a product-relative proxy only — not a production call — until live TCA / rejects / stress-window samples exist.`
    : baseVerdict;

  steps.push({
    id: "verdict",
    index: 11,
    title: zh ? "结论与方法论下一步" : "Verdict & methodology next steps",
    action: zh
      ? "给出相对该品种的红黄绿代理评分与可执行下一步（LP UAT → 历史回测 → 影子行情 → 小额实盘 → 上线）；若数据不足则明确点出瓶颈。"
      : "Issue product-relative red/yellow/green proxy score and next steps (LP UAT → backtest → live shadow → small live → go-live); name the bottleneck when data is insufficient.",
    result: verdict,
    details: zh
      ? [
          ...(dataBottleneck.hit
            ? [`数据可得性瓶颈：${dataBottleneck.gaps[0]}`]
            : []),
          `品种 ${symbol ?? "—"} 代理分：${overall}/100（${bandLabel}）`,
          ...subjectScores.slice(0, 5).map(
            (s) => `${s.name}: ${s.score}/100 · ${scoreBandLabel(s.band, locale)}`,
          ),
          "下一步 1：LP UAT（新连接）或复用已有会话（已接入 LP）",
          "下一步 2：历史回测价差/跳价/稳定性（不作延迟/Last Look 证明）",
          "下一步 3：生产行情影子 — 延迟、断流、跨 LP 对比",
          "下一步 4：小额实盘 Fill/Slippage/Last Look + 上线监控",
        ]
      : [
          ...(dataBottleneck.hit
            ? [`Data-availability bottleneck: ${dataBottleneck.gaps[0]}`]
            : []),
          `Product ${symbol ?? "—"} proxy score: ${overall}/100 (${bandLabel})`,
          ...subjectScores.slice(0, 5).map(
            (s) => `${s.name}: ${s.score}/100 · ${scoreBandLabel(s.band, locale)}`,
          ),
          "Next 1: LP UAT (new connect) or reuse live session (LP already on)",
          "Next 2: Historical spread/jump/stability backtest (not latency/last-look proof)",
          "Next 3: Production MD shadow — latency, gaps, cross-LP compare",
          "Next 4: Small live fill/slippage/last look + go-live monitors",
        ],
    status: dataBottleneck.hit || overallBand === "red" ? "warn" : "done",
    pros: overallBand !== "red" ? [zh ? "值得进入 PoC 预算" : "Worth a PoC budget"] : [],
    cons: [
      ...(dataBottleneck.hit
        ? [
            zh
              ? "数据可得性是瓶颈 — 不可仅凭代理分加大生产流量"
              : "Data availability is the bottleneck — do not ramp production on proxy score alone",
          ]
        : []),
      ...(overallBand === "red"
        ? [zh ? "红色偏弱 — 不宜直接加大生产流量" : "Red / weak — do not ramp production flow yet"]
        : []),
    ],
  });

  return {
    mode,
    subject: primary?.name ?? (mode === "product" ? symbol ?? "—" : "—"),
    product: symbol,
    locale,
    generatedAt: new Date().toISOString(),
    overallScore: overall,
    overallBand,
    verdict,
    summaryPros,
    summaryCons,
    steps,
    subjects: subjectScores,
    dataBottleneck,
    liveFindings,
    disclaimer: zh
      ? "本报告为知识库 + 启发式实时研究代理结果，不能替代实盘 TCA、牌照法律意见或授信审批。红/黄/绿分为相对该品种的代理适配度。请按最终方法论（UAT + 回测 + 影子 + 小额实盘）验证。若标明数据可得性是瓶颈，须先补齐实盘样本再下质量定论。"
      : "This report combines KB + heuristic live-research proxies. It does not replace live TCA, legal licence opinions, or credit approval. Red/yellow/green scores are product-relative proxy fit only. Verify via the final methodology (UAT + backtest + shadow + small live). When data availability is the bottleneck, obtain live samples before a quality call.",
  };
}

export function stepDelayMs(index: number): number {
  // Stagger for realtime UX
  return delayHint(450 + index * 180);
}

export function buildPrintableHtml(
  report: QualityReport,
  opts?: { assetOrigin?: string },
): string {
  const zh = isZh(report.locale);
  const when = new Date(report.generatedAt).toLocaleString(dateLocale(report.locale), {
    timeZone: "Asia/Singapore",
  });
  const origin = (opts?.assetOrigin ?? "").replace(/\/$/, "");
  const assetUrl = (path: string) => {
    if (/^https?:\/\//i.test(path)) return path;
    return origin ? `${origin}${path.startsWith("/") ? path : `/${path}`}` : path;
  };
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
  .bottleneck { background: #fff7ed; border: 1px solid #f0b27a; padding: 12px 14px; border-radius: 8px; margin: 12px 0; }
  .bottleneck strong { color: #b45309; }
  .score { font-size: 22px; font-weight: 700; }
  .score.green { color: #15803d; }
  .score.yellow { color: #c2410c; }
  .score.red { color: #b91c1c; }
  .chip { display: inline-block; font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 999px; margin-left: 6px; }
  .chip.green { background: #dcfce7; color: #15803d; }
  .chip.yellow { background: #ffedd5; color: #c2410c; }
  .chip.red { background: #fee2e2; color: #b91c1c; }
  .pc { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .pc div { background: #f8fafc; border-radius: 6px; padding: 8px 10px; }
  .step { break-inside: avoid; margin: 14px 0; padding-bottom: 10px; border-bottom: 1px dashed #d7e0ea; }
  .badge { font-size: 11px; color: #0f766e; font-weight: 600; text-transform: uppercase; }
  ul { margin: 6px 0 0 18px; padding: 0; }
  li { margin: 2px 0; font-size: 13px; }
  ul.subjects { list-style: none; margin-left: 0; }
  ul.subjects li { display: flex; align-items: center; gap: 8px; margin: 6px 0; flex-wrap: wrap; }
  .logo { width: 28px; height: 28px; object-fit: contain; border: 1px solid #c5d0db; border-radius: 6px; background: #fff; padding: 1px; }
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
  <p class="score ${report.overallBand}">${zh ? "品种适配代理分" : "Product-fit proxy score"}: ${report.overallScore}/100
    <span class="chip ${report.overallBand}">${esc(scoreBandLabel(report.overallBand, report.locale))}</span></p>
  <p class="meta">${zh ? "阈值" : "Bands"}: ${zh ? "绿 ≥85 · 黄 65–84 · 红 &lt;65（相对该品种）" : "Green ≥85 · Yellow 65–84 · Red &lt;65 (product-relative)"}</p>
  ${
    report.dataBottleneck.hit
      ? `<div class="bottleneck"><strong>${zh ? "数据可得性是瓶颈" : "Data availability is the bottleneck"}</strong>
      <p>${esc(report.dataBottleneck.message)}</p>
      <ul>${report.dataBottleneck.gaps.map((g) => `<li>${esc(g)}</li>`).join("")}</ul></div>`
      : ""
  }
  <div class="verdict"><strong>${zh ? "结论" : "Verdict"}:</strong> ${esc(report.verdict)}</div>

  <h2>${zh ? "总览优势 / 局限" : "Summary pros / cons"}</h2>
  <div class="pc">
    <div><h4>${zh ? "优势" : "Pros"}</h4><ul>${report.summaryPros.map((p) => `<li>${esc(p)}</li>`).join("") || "<li>—</li>"}</ul></div>
    <div><h4>${zh ? "局限" : "Cons"}</h4><ul>${report.summaryCons.map((c) => `<li>${esc(c)}</li>`).join("") || "<li>—</li>"}</ul></div>
  </div>

  ${
    report.liveFindings.length
      ? `<h2>${zh ? "仓库 / 公开实据" : "Repository / public evidence"}</h2>
      <ul>${report.liveFindings.map((f) => `<li>${esc(f)}</li>`).join("")}</ul>`
      : ""
  }

  <h2>${zh ? "对照对象（按品种着色）" : "Subjects compared (coloured by product fit)"}</h2>
  <ul class="subjects">${report.subjects
    .map((s) => {
      const src = assetUrl(s.logoUrl || `/logos/${s.slug}.png`);
      return `<li><img class="logo" src="${esc(src)}" alt="" width="28" height="28"/> <strong>${esc(s.name)}</strong>
        <span class="chip ${s.band}">${s.score}/100 · ${esc(scoreBandLabel(s.band, report.locale))}</span>
        ${s.offersProduct ? (zh ? " · 显式覆盖" : " · covers product") : (zh ? " · 覆盖弱" : " · weak coverage")}
        ${s.usedByVantage ? (zh ? " · Vantage在用" : " · Vantage-used") : ""}
        ${s.reason ? ` <span class="meta">— ${esc(s.reason)}</span>` : ""}</li>`;
    })
    .join("")}</ul>

  <h2>${zh ? "分步研究记录" : "Step-by-step research log"}</h2>
  ${stepsHtml}

  <p class="disclaimer">${esc(report.disclaimer)}</p>
  <script>window.addEventListener('load',()=>{ /* ready for print */ });</script>
</body>
</html>`;
}
