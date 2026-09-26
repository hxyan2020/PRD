import { detectAssets } from "./classify";
import { assetLabel, placeLabel } from "./i18n/lookups";
import type { NewsItem } from "./types";

export interface NamedParty {
  nameEn: string;
  nameZh: string;
}

export interface PlatformImpactCopy {
  summary: string;
  summaryZh: string;
}

const WEAK =
  /\b(e-?mail alert|daybook|newsletter|morning minute|corn\b|hog\b|wheat\b|cotton\b|soybean|price target|reiterated by|outflow alert)\b/i;

type Theme =
  | "enforcement"
  | "rule"
  | "license"
  | "perp"
  | "etf"
  | "stable"
  | "custody"
  | "kyc"
  | "surv"
  | "order"
  | "copy"
  | "margin"
  | "fx";

const THEMES: Array<[Theme, RegExp]> = [
  ["enforcement", /\b(enforcement|consent order|fine|penalty|sanction)\b/i],
  ["rule", /\b(rulemaking|guidance|mica|clarity act|genius act|capital rule|consultation)\b/i],
  ["license", /\b(license|authoris|authoriz)\b/i],
  ["perp", /\b(perpetual|perps?\b|futures contract)\b/i],
  ["etf", /\betfs?\b/i],
  ["stable", /\b(stablecoin|usdc|usdt|tether|circle)\b/i],
  ["custody", /\b(custody|wallet|safeguard)\b/i],
  ["kyc", /\b(kyc|kyb|aml|onboarding|travel[- ]rule)\b/i],
  ["surv", /\b(surveillance|market abuse|transaction monitoring)\b/i],
  ["order", /\b(twap|vwap|iceberg|order type)\b/i],
  ["copy", /\b(copy trading|cashtag|social trading)\b/i],
  ["margin", /\b(margin|leverage)\b/i],
  ["fx", /\b(fx\b|foreign exchange|currency pair)\b/i],
];

const CATEGORY_LEAD: Record<NewsItem["category"], { en: string; zh: string }> = {
  listing: {
    en: "A listing or instrument change can shift the product shelf that a multi-asset broker such as Vantage has to price, hedge, and offer.",
    zh: "新上市或合约调整会影响 Vantage 这类多资产券商需要定价、对冲和上架的品种。",
  },
  product: {
    en: "A feature or product launch can reset what clients expect from a multi-asset broker such as Vantage on execution, access, or custody.",
    zh: "产品或功能上线会改变客户对 Vantage 这类多资产券商在执行、准入或托管上的预期。",
  },
  regulation: {
    en: "This regulatory move can change what a multi-asset broker such as Vantage may market, onboard, or leverage in the affected markets.",
    zh: "此项监管动态可能改变 Vantage 这类多资产券商在相关市场的营销、开户或杠杆安排。",
  },
  risk_tools: {
    en: "A risk, KYC, or surveillance development can raise the control standard for a multi-asset broker such as Vantage.",
    zh: "风险、KYC 或监察工具的变化会提高 Vantage 这类多资产券商的风控标准。",
  },
};

const THEME_COPY: Record<Theme, { en: string; zh: string }> = {
  enforcement: {
    en: "Enforcement against a venue or broker is a warning on marketing, onboarding, and any liquidity or white-label link that touches the same product.",
    zh: "对交易所或券商的执法，是对营销、开户以及同类产品流动性或白标合作的警示。",
  },
  rule: {
    en: "Rulemaking and guidance often land as product eligibility, leverage caps, or disclosure edits for CFD and crypto clients in that jurisdiction.",
    zh: "规则制定与指引通常会落到该法域差价合约和加密客户的产品准入、杠杆上限或披露修订上。",
  },
  license: {
    en: "Licensing news can open or close client acquisition from that country. Legal should mark whether Vantage can still onboard or advertise there.",
    zh: "牌照消息会打开或关上该国获客通道。法务应确认 Vantage 是否仍可在当地开户或做宣传。",
  },
  perp: {
    en: "Perpetual or futures specs feed CFD and crypto books: margin, funding, and tick size need a pass before clients ask for the same exposure.",
    zh: "永续或期货合约规格会传导到差价合约和加密账本：在客户要求同一敞口前，需复核保证金、资金费率和最小变动价位。",
  },
  etf: {
    en: "ETF exposure usually maps to share or ETF CFDs, so the desk should check borrow, corporate actions, and whether a matching line can be quoted without widening spreads.",
    zh: "ETF 敞口通常对应股票或 ETF 差价合约，台面应检查借券、公司行动，以及能否在不扩大点差的情况下给出对应报价。",
  },
  stable: {
    en: "Stablecoin rails affect crypto CFD settlement, payments, and travel-rule onboarding. Treasury should check whether USDC or USDT flow touches client money or hedges.",
    zh: "稳定币轨道影响加密差价合约结算、支付和旅行规则开户。资金部应检查 USDC 或 USDT 流动是否触及客户资金或对冲。",
  },
  custody: {
    en: "Custody or wallet launches change how clients hold the underlying versus a Vantage CFD. Safeguarding should confirm the unallocated versus on-venue path.",
    zh: "托管或钱包上线会改变客户持有标的与持有 Vantage 差价合约的方式。客户资产保护应确认非分配持仓与场内路径。",
  },
  kyc: {
    en: "KYC or AML changes hit onboarding conversion and the evidence trail for a retail multi-asset book. Compare the control to the current stack before tightening checks.",
    zh: "KYC 或反洗钱变化会影响零售多资产账本的开户转化与留痕。收紧核验前，应对照现有风控栈。",
  },
  surv: {
    en: "Surveillance or market-abuse tooling can become the evidence standard counterparties and regulators expect from brokers that offer CFDs and DMA.",
    zh: "监察或市场滥用工具可能成为对手方和监管对提供差价合约与 DMA 的券商所要求的举证标准。",
  },
  order: {
    en: "New order types (TWAP, VWAP, iceberg) set a feature bar. Execution should decide whether a matching algo or child-order path is needed on the Vantage side.",
    zh: "新的订单类型（TWAP、VWAP、冰山单）会抬高功能门槛。执行台应判断 Vantage 是否需要对应算法或子单路径。",
  },
  copy: {
    en: "Social or cashtag-style trading can pull retail flow. Product should judge whether a similar engagement feature is in scope without breaking marketing rules.",
    zh: "社交或 Cashtag 式交易会拉动零售流量。产品应判断同类互动功能是否在范围内，且不违反营销规则。",
  },
  margin: {
    en: "Margin or leverage changes transmit directly to retail CFD limits and forced-liquidation settings.",
    zh: "保证金或杠杆变化会直接传导到零售差价合约限额和强制平仓设置。",
  },
  fx: {
    en: "FX remains a core multi-asset book. A bank or venue move here can change prime coverage, spreads, or last-look assumptions.",
    zh: "外汇仍是多资产核心账本。银行或场所在此的动作可能改变主经纪覆盖、点差或 last-look 假设。",
  },
};

const WEAK_COPY = {
  en: "This item is background for a multi-asset broker such as Vantage. Treat it as context unless it turns into a listing, product, or rule change that would hit pricing, margin, or client eligibility.",
  zh: "对本条而言，Vantage 这类多资产券商只需作背景了解。除非后续变成上市、产品或规则变化，否则不必立即调整定价、保证金或客户准入。",
};

const CLOSE = {
  en: "Map the story to the matching CFD, DMA, or crypto line and decide whether pricing, margin, or client comms need a change this week.",
  zh: "请将本条对应到相关的差价合约、DMA 或加密品种，并判断本周是否需要调整定价、保证金或客户沟通。",
};

function storyText(item: NewsItem): string {
  return `${item.caption} ${item.keyPoints.join(" ")}`;
}

function listEn(values: string[]): string {
  if (values.length === 1) return values[0];
  if (values.length === 2) return `${values[0]} and ${values[1]}`;
  return `${values.slice(0, -1).join(", ")}, and ${values[values.length - 1]}`;
}

function listZh(values: string[]): string {
  return values.join("、");
}

function pickThemes(text: string): Theme[] {
  const hits: Theme[] = [];
  for (const [theme, pattern] of THEMES) {
    if (pattern.test(text)) hits.push(theme);
    if (hits.length === 2) break;
  }
  return hits;
}

export function deskPlatformImpact(
  item: NewsItem,
  named: NamedParty[] = [],
): PlatformImpactCopy {
  const text = storyText(item);
  if (WEAK.test(text)) {
    return { summary: WEAK_COPY.en, summaryZh: WEAK_COPY.zh };
  }

  const en: string[] = [CATEGORY_LEAD[item.category].en];
  const zh: string[] = [CATEGORY_LEAD[item.category].zh];

  for (const theme of pickThemes(text)) {
    en.push(THEME_COPY[theme].en);
    zh.push(THEME_COPY[theme].zh);
  }

  const namesEn = named.slice(0, 3).map((entry) => entry.nameEn);
  const namesZh = named.slice(0, 3).map((entry) => entry.nameZh);
  if (namesEn.length) {
    en.push(
      `Names in this story (${listEn(namesEn)}) sit on the same liquidity or marketing map, so flow and spreads versus Vantage can shift.`,
    );
    zh.push(
      `文中提及的${listZh(namesZh)}与 Vantage 处于同一流动性或获客地图，客户流与点差可能随之变化。`,
    );
  }

  const places = item.jurisdictions.filter((name) => name && name !== "Global").slice(0, 3);
  if (places.length) {
    en.push(
      `Watch ${listEn(places)}: product eligibility, promotions, and leverage for clients in those markets may need a compliance pass.`,
    );
    zh.push(
      `需关注${listZh(places.map((name) => placeLabel(name, "zh")))}：这些市场的产品准入、宣传与杠杆可能要做合规复核。`,
    );
  }

  const assets = [...new Set([...(item.impact?.assets ?? []), ...detectAssets(text)])].slice(0, 4);
  if (assets.length) {
    en.push(`Focus exposures: ${assets.join(", ")}.`);
    zh.push(`关注敞口：${assets.map((asset) => assetLabel(asset, "zh")).join("、")}。`);
  }

  en.push(CLOSE.en);
  zh.push(CLOSE.zh);

  return {
    summary: en.join(" "),
    summaryZh: zh.join(""),
  };
}
