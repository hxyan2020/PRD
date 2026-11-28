import { isZh } from "@/lib/i18n/locale";
import type {
  QualityChart,
  QualityDataSource,
  QualityStep,
  QualitySubjectScore,
} from "@/lib/quality-research";
import type { Locale, LpRecord } from "@/lib/types";

const LATENCY_SCORE: Record<string, number> = {
  "ultra-low": 92,
  low: 74,
  medium: 48,
};

function src(
  id: string,
  name: string,
  available: boolean,
  opts?: { url?: string; howToGet?: string; note?: string },
): QualityDataSource {
  return { id, name, available, ...opts };
}

function commonAvailable(locale: Locale): QualityDataSource[] {
  const zh = isZh(locale);
  const tw = locale === "zh-TW";
  return [
    src(
      "repo",
      tw ? "本應用 LP倉庫" : zh ? "本应用 LP仓库" : "In-app LP Repository",
      true,
      {
        url: "/repository",
        note: tw
          ? "已標註產品表、成本檔、延遲檔、監管標籤"
          : zh
            ? "已标注产品表、成本档、延迟档、监管标签"
            : "Product lists, cost/latency tiers, regulation tags",
      },
    ),
    src(
      "kb",
      tw ? "本應用知識庫" : zh ? "本应用知识库" : "In-app Knowledge Base",
      true,
      {
        url: "/knowledge",
        note: tw
          ? "優勢 / 局限 / 最適區域文字摘要"
          : zh
            ? "优势 / 局限 / 最优区域文字摘要"
            : "Strengths / weaknesses / optimal-region notes",
      },
    ),
  ];
}

function liveUnavailable(locale: Locale): QualityDataSource[] {
  const zh = isZh(locale);
  const tw = locale === "zh-TW";
  return [
    src(
      "fix-demo",
      tw ? "LP FIX / 可成交盤口 Demo" : zh ? "LP FIX / 可成交盘口 Demo" : "LP FIX / executable book demo",
      false,
      {
        url: "https://www.equidity.com/blog/how-to-select-a-liquidity-provider-for-your-brokerage/",
        howToGet: tw
          ? "向 LP 銷售申請 Demo/UAT：索取 FIX 會話、品種映射與可成交檔位；在你機房連線後錄 quote→ack。"
          : zh
            ? "向 LP 销售申请 Demo/UAT：索取 FIX 会话、品种映射与可成交档位；在你机房连线后录 quote→ack。"
            : "Request LP Demo/UAT from sales: FIX session, symbol map, executable levels; record quote→ack from your colo.",
      },
    ),
    src(
      "tca",
      tw ? "TCA 成交 / 滑點樣本" : zh ? "TCA 成交 / 滑点样本" : "TCA fill / slippage sample",
      false,
      {
        url: "https://www.amts.com/blog/how-to-choose-a-liquidity-provider/",
        howToGet: tw
          ? "從 OMS/EMS 或中台匯出成交：時間戳、請求價、成交價、數量、拒單碼；至少覆蓋平靜市與新聞窗。"
          : zh
            ? "从 OMS/EMS 或中台汇出成交：时间戳、请求价、成交价、数量、拒单码；至少覆盖平静市与新闻窗。"
            : "Export fills from OMS/EMS or middle-office: timestamps, request/fill price, size, reject codes; cover quiet + news windows.",
      },
    ),
    src(
      "lastlook",
      tw ? "Last look / 拒單遙測" : zh ? "Last look / 拒单遥测" : "Last-look / reject telemetry",
      false,
      {
        howToGet: tw
          ? "開啟 drop copy 或成交回報，統計 last-look 時長與拒單碼分佈；要求 LP 書面政策。"
          : zh
            ? "开启 drop copy 或成交回报，统计 last-look 时长与拒单码分布；要求 LP 书面政策。"
            : "Enable drop-copy/execution reports; measure last-look duration + reject-code mix; demand written LP policy.",
      },
    ),
    src(
      "stress",
      tw ? "壓力窗實盤樣本" : zh ? "压力窗实盘样本" : "Stress-window live sample",
      false,
      {
        howToGet: tw
          ? "與 LP 約定 NFP/央行/開盤窗小額掃單；對比平靜市 vs 壓力市有效成本。"
          : zh
            ? "与 LP 约定 NFP/央行/开盘窗小额扫单；对比平静市 vs 压力市有效成本。"
            : "Schedule small sweeps with the LP around NFP/CB/opens; compare quiet vs stress all-in cost.",
      },
    ),
  ];
}

function publicRegs(locale: Locale): QualityDataSource[] {
  const zh = isZh(locale);
  const tw = locale === "zh-TW";
  return [
    src("fca", "FCA Register", true, {
      url: "https://register.fca.org.uk/",
      note: tw
        ? "免費查英國牌照主體（簽約實體≠品牌）"
        : zh
          ? "免费查英国牌照主体（签约实体≠品牌）"
          : "Free UK licence entity lookup (brand ≠ contracting entity)",
    }),
    src("asic", "ASIC Connect", true, {
      url: "https://asic.gov.au/",
      note: tw ? "澳洲牌照公開查詢入口" : zh ? "澳洲牌照公开查询入口" : "Australia licence public search entry",
    }),
  ];
}

function bar(
  id: string,
  title: string,
  series: QualityChart["series"],
  analysis: string,
  unit = "/100",
): QualityChart {
  return { id, kind: "bar", title, series, analysis, unit };
}

export function enrichQualitySteps(args: {
  locale: Locale;
  steps: QualityStep[];
  subjects: QualitySubjectScore[];
  lps: LpRecord[];
  symbol?: string;
  session: string;
}): QualityStep[] {
  const { locale, steps, subjects, lps, symbol, session } = args;
  const zh = isZh(locale);
  const tw = locale === "zh-TW";
  const avail = commonAvailable(locale);
  const live = liveUnavailable(locale);
  const regs = publicRegs(locale);

  const scoreSeries = subjects.map((s) => ({
    label: s.name,
    value: s.score,
    band: s.band,
  }));

  const pricingSeries = lps.slice(0, 5).map((lp) => ({
    label: lp.name,
    value: Math.round(lp.pricingQuality * 20),
  }));

  const latencySeries = lps.slice(0, 5).map((lp) => ({
    label: lp.name,
    value: LATENCY_SCORE[lp.latencyProfile] ?? 50,
  }));

  const sessionSeries = lps.slice(0, 5).map((lp) => {
    const fit =
      session === "24/7"
        ? lp.hours === "24/7" || lp.hours === "mixed"
        : session === "24/5"
          ? lp.hours === "24/5" || lp.hours === "mixed"
          : true;
    return { label: lp.name, value: fit ? 100 : 28 };
  });

  const byId: Record<string, Partial<QualityStep>> = {
    scope: {
      analysis: tw
        ? `本步用倉庫標籤界定 ${symbol ?? "標的"} 候選集。圖表顯示各 LP 相對該品種的代理適配分，作為後續步驟的基準線。`
        : zh
          ? `本步用仓库标签界定 ${symbol ?? "标的"} 候选集。图表显示各 LP 相对该品种的代理适配分，作为后续步骤的基准线。`
          : `This step scopes ${symbol ?? "the product"} candidates from repository tags. The chart baselines each LP’s product-fit proxy score for later steps.`,
      dataSources: [...avail],
      charts: [
        bar(
          "scope-scores",
          tw ? "候選代理適配分" : zh ? "候选代理适配分" : "Candidate proxy fit scores",
          scoreSeries,
          tw
            ? "分數來自倉庫能力提示 + 定價/時段/覆蓋啟發式，非實盤 TCA。"
            : zh
              ? "分数来自仓库能力提示 + 定价/时段/覆盖启发式，非实盘 TCA。"
              : "Scores from repository capability hints + pricing/hours/coverage heuristics — not live TCA.",
        ),
      ],
    },
    data: {
      analysis: tw
        ? "可免費取得的是倉庫/知識庫與公開牌照查詢；FIX 盤口、TCA、拒單與壓力窗樣本無法在此免費取得，因此數據可得性成為瓶頸。"
        : zh
          ? "可免费取得的是仓库/知识库与公开牌照查询；FIX 盘口、TCA、拒单与压力窗样本无法在此免费取得，因此数据可得性成为瓶颈。"
          : "Free inputs are the repository/KB and public licence lookups. FIX books, TCA, rejects and stress samples are not free here — so data availability is the bottleneck.",
      dataSources: [...avail, ...regs, ...live],
      charts: [
        bar(
          "data-availability",
          tw ? "資料來源可得性（有=100 / 無=0）" : zh ? "数据来源可得性（有=100 / 无=0）" : "Source availability (yes=100 / no=0)",
          [
            { label: tw ? "倉庫" : zh ? "仓库" : "Repo", value: 100 },
            { label: tw ? "知識庫" : zh ? "知识库" : "KB", value: 100 },
            { label: "FIX", value: 0 },
            { label: "TCA", value: 0 },
            { label: tw ? "拒單" : zh ? "拒单" : "Rejects", value: 0 },
            { label: tw ? "壓力窗" : zh ? "压力窗" : "Stress", value: 0 },
          ],
          tw
            ? "右側三項需向 LP/中台索取；下方列出連結與獲取方式。"
            : zh
              ? "右侧三项需向 LP/中台索取；下方列出链接与获取方式。"
              : "The right-hand gaps require LP/middle-office access; acquisition links are listed below.",
        ),
      ],
    },
    coverage: {
      analysis: tw
        ? `對 ${symbol ?? "標的"} 用產品表覆蓋 + 家族能力分作可成交代理。綠色越高越可能有顯式覆蓋；仍須 Demo 掃單驗證。`
        : zh
          ? `对 ${symbol ?? "标的"} 用产品表覆盖 + 家族能力分作可成交代理。绿色越高越可能有显式覆盖；仍须 Demo 扫单验证。`
          : `For ${symbol ?? "the product"}, product-list coverage + family capability is the executable proxy. Greener bars imply clearer coverage — still verify with demo sweeps.`,
      dataSources: [
        ...avail,
        live.find((s) => s.id === "fix-demo")!,
      ],
      charts: [
        bar(
          "coverage-scores",
          tw ? "可成交代理分（相對品種）" : zh ? "可成交代理分（相对品种）" : "Executable proxy vs product",
          scoreSeries,
          tw
            ? "分析：分數差反映覆蓋與定價啟發式，不是盤口檔位深度。"
            : zh
              ? "分析：分数差反映覆盖与定价启发式，不是盘口档位深度。"
              : "Analysis: score gaps reflect coverage/pricing heuristics, not live book depth.",
        ),
      ],
    },
    cost: {
      analysis: tw
        ? "定價品質×20 作為可見代理；有效成本仍需 TCA（價差+滑點+費用+融資）。"
        : zh
          ? "定价质量×20 作为可见代理；有效成本仍需 TCA（价差+滑点+费用+融资）。"
          : "Pricing quality×20 is the visible proxy; all-in cost still needs TCA (spread+slippage+fees+financing).",
      dataSources: [...avail, live.find((s) => s.id === "tca")!],
      charts: [
        bar(
          "pricing",
          tw ? "定價品質代理（×20）" : zh ? "定价质量代理（×20）" : "Pricing-quality proxy (×20)",
          pricingSeries,
          tw
            ? "較高柱表示倉庫定價評級更好；不能替代成交後成本。"
            : zh
              ? "较高柱表示仓库定价评级更好；不能替代成交后成本。"
              : "Taller bars mean better repository pricing grades — not post-trade cost.",
        ),
      ],
    },
    session: {
      analysis: tw
        ? `品種時段需求 ${session}：匹配=100，不匹配=28。不匹配易導致假價或拒單。`
        : zh
          ? `品种时段需求 ${session}：匹配=100，不匹配=28。不匹配易导致假价或拒单。`
          : `Product session need ${session}: fit=100, mismatch=28. Mismatch raises stale-quote / reject risk.`,
      dataSources: [...avail],
      charts: [
        bar(
          "session-fit",
          tw ? "時段匹配分數" : zh ? "时段匹配分数" : "Session-fit score",
          sessionSeries,
          tw
            ? "分析：加密需 24/7；傳統 24/5 在收市前後常塌陷。"
            : zh
              ? "分析：加密需 24/7；传统 24/5 在收市前后常塌陷。"
              : "Analysis: crypto wants 24/7; traditional 24/5 often collapses around closes.",
        ),
      ],
    },
    latency: {
      analysis: tw
        ? "延遲檔映射為代理分（超低 92 / 低 74 / 中 48）。正式 p95 需在目標機房實測。"
        : zh
          ? "延迟档映射为代理分（超低 92 / 低 74 / 中 48）。正式 p95 需在目标机房实测。"
          : "Latency tiers mapped to proxy scores (ultra-low 92 / low 74 / medium 48). True p95 needs colo measurement.",
      dataSources: [
        ...avail,
        live.find((s) => s.id === "fix-demo")!,
      ],
      charts: [
        bar(
          "latency",
          tw ? "延遲檔代理分" : zh ? "延迟档代理分" : "Latency-tier proxy",
          latencySeries,
          tw
            ? "分析：活躍流應優先 ultra-low/low；技術層需疊真實場所。"
            : zh
              ? "分析：活跃流应优先 ultra-low/low；技术层需叠真实场所。"
              : "Analysis: active flow prefers ultra-low/low; tech layers need real venues underneath.",
        ),
      ],
    },
    lastlook: {
      analysis: tw
        ? "本應用沒有拒單遙測。圖表僅重申代理適配；結論必須等 last-look/拒單樣本。"
        : zh
          ? "本应用没有拒单遥测。图表仅重申代理适配；结论必须等 last-look/拒单样本。"
          : "No reject telemetry in-app. Chart restates proxy fit; conclusions wait on last-look/reject samples.",
      dataSources: [live.find((s) => s.id === "lastlook")!, live.find((s) => s.id === "tca")!, ...avail],
      charts: [
        bar(
          "lastlook-proxy",
          tw ? "代理適配（非拒單率）" : zh ? "代理适配（非拒单率）" : "Proxy fit (not reject rate)",
          scoreSeries,
          tw
            ? "無法繪製拒單率圖 — 請按下方連結向 LP 索取 drop copy。"
            : zh
              ? "无法绘制拒单率图 — 请按下方链接向 LP 索取 drop copy。"
              : "Cannot chart reject rates — request drop-copy via the acquisition links below.",
        ),
      ],
    },
    stress: {
      analysis: tw
        ? "壓力窗為計劃性評估。免費數據不足以支撐壓力有效成本圖；需約定掃單窗。"
        : zh
          ? "压力窗为计划性评估。免费数据不足以支撑压力有效成本图；需约定扫单窗。"
          : "Stress readiness is planned assessment. Free data cannot support a stress all-in cost chart — schedule sweeps.",
      dataSources: [live.find((s) => s.id === "stress")!, live.find((s) => s.id === "tca")!, ...avail],
      charts: [
        bar(
          "stress-plan",
          tw ? "壓力就緒代理（計劃分）" : zh ? "压力就绪代理（计划分）" : "Stress readiness proxy (plan score)",
          subjects.map((s) => ({
            label: s.name,
            value: s.usedByVantage ? 70 : 45,
          })),
          tw
            ? "Vantage 在用路徑給更高計劃分（可知歷史）；仍非實盤壓力結果。"
            : zh
              ? "Vantage 在用路径给更高计划分（可知历史）；仍非实盘压力结果。"
              : "Vantage-used paths get a higher plan score (known history) — still not live stress fills.",
        ),
      ],
    },
    counterparty: {
      analysis: tw
        ? "監管標籤來自倉庫；可用 FCA/ASIC 免費核對實體。授信與隔離仍需法務/財務。"
        : zh
          ? "监管标签来自仓库；可用 FCA/ASIC 免费核对实体。授信与隔离仍需法务/财务。"
          : "Regulation tags come from the repository; cross-check entities for free on FCA/ASIC. Credit/segregation still need legal/finance.",
      dataSources: [...avail, ...regs],
      charts: [
        bar(
          "reg-clarity",
          tw ? "監管標籤清晰度代理" : zh ? "监管标签清晰度代理" : "Regulation-tag clarity proxy",
          lps.slice(0, 5).map((lp) => ({
            label: lp.name,
            value: lp.regulation.some((r) => /unverified/i.test(r))
              ? 25
              : lp.regulation.length
                ? 85
                : 40,
          })),
          tw
            ? "低分=未核實標籤；請用下方牌照連結核對簽約實體。"
            : zh
              ? "低分=未核实标签；请用下方牌照链接核对签约实体。"
              : "Low score = unverified tags; use licence links below to confirm contracting entities.",
        ),
      ],
    },
    proscons: {
      analysis: tw
        ? "綜合知識庫優劣與本輪代理分。圖表重申產品適配，方便對照文字結論。"
        : zh
          ? "综合知识库优劣与本轮代理分。图表重申产品适配，方便对照文字结论。"
          : "Merges KB pros/cons with this run’s proxy scores. Chart restates product fit beside the narrative.",
      dataSources: [...avail],
      charts: [
        bar(
          "proscons-scores",
          tw ? "綜合對照代理分" : zh ? "综合对照代理分" : "Synthesis proxy scores",
          scoreSeries,
          tw
            ? "分析：文字優劣應與柱狀高低一致；若矛盾，以實盤樣本為準。"
            : zh
              ? "分析：文字优劣应与柱状高低一致；若矛盾，以实盘样本为准。"
              : "Analysis: narrative pros/cons should align with bar height; if not, trust live samples.",
        ),
      ],
    },
    verdict: {
      analysis: tw
        ? "最終紅黃綠分是相對該品種的代理適配。若資料瓶頸仍在，勿據此加大生產流量。"
        : zh
          ? "最终红黄绿分是相对该品种的代理适配。若数据瓶颈仍在，勿据此加大生产流量。"
          : "Final RYG is product-relative proxy fit. If the data bottleneck remains, do not ramp production on it.",
      dataSources: [...avail, ...live, ...regs],
      charts: [
        bar(
          "verdict-scores",
          tw ? "結論用代理適配分" : zh ? "结论用代理适配分" : "Verdict proxy fit scores",
          scoreSeries,
          tw
            ? "綠≥85 / 黃65–84 / 紅<65。柱狀支撐文字結論；缺失的 FIX/TCA 見獲取方式。"
            : zh
              ? "绿≥85 / 黄65–84 / 红<65。柱状支撑文字结论；缺失的 FIX/TCA 见获取方式。"
              : "Green≥85 / Yellow 65–84 / Red<65. Bars support the written verdict; missing FIX/TCA paths are listed below.",
        ),
      ],
    },
  };

  return steps.map((step) => {
    const extra = byId[step.id] ?? {};
    return {
      ...step,
      analysis: extra.analysis ?? step.result,
      dataSources: extra.dataSources ?? avail,
      charts: extra.charts ?? [],
    };
  });
}
