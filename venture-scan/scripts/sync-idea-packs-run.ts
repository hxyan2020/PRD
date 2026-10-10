import { writeFileSync } from "fs";
import { catalogIdeas } from "../lib/catalog";
import packEn from "../lib/i18n/idea-packs/en.json";
import packZh from "../lib/i18n/idea-packs/zh-CN.json";
import packZhTW from "../lib/i18n/idea-packs/zh-TW.json";

type Fields = {
  name: string;
  description: string;
  businessModel: string;
  industry: string;
  sector: string;
  fundingRoundNote: string;
  goForwardSummary: string;
};

const ideas = catalogIdeas();
const en: Record<string, Fields> = { ...(packEn as Record<string, Fields>) };
const zh: Record<string, Fields> = { ...(packZh as Record<string, Fields>) };
const zhTW: Record<string, Fields> = { ...(packZhTW as Record<string, Fields>) };

function fields(idea: (typeof ideas)[0]): Fields {
  return {
    name: idea.name,
    description: idea.description,
    businessModel: idea.businessModel,
    industry: idea.industry,
    sector: idea.sector,
    fundingRoundNote: idea.fundingRoundNote || "",
    goForwardSummary: idea.goForward.summary || "",
  };
}

const industryZh: Record<string, string> = {
  FinTech: "金融科技",
  Media: "媒体",
  SaaS: "SaaS",
  AI: "人工智能",
  Mobility: "出行",
  Commerce: "电商",
  Banking: "银行",
  Payments: "支付",
  "Developer Tools": "开发者工具",
  Productivity: "生产力",
  Security: "安全",
  Energy: "能源",
  HR: "人力资源",
  Biotech: "生物科技",
  Hardware: "硬件",
  Gaming: "游戏",
  Travel: "旅游",
  Food: "食品",
  Logistics: "物流",
  Insurance: "保险",
  EdTech: "教育科技",
  "Health Tech": "健康科技",
  "Climate Tech": "气候科技",
  Manufacturing: "制造业",
  Agritech: "农业科技",
  "Legal Tech": "法律科技",
  "Prop Tech": "地产科技",
  "Mar Tech": "营销科技",
};

const sectorZh: Record<string, string> = {};
for (const slug of Object.keys(packZh)) {
  const e = (packEn as Record<string, Fields>)[slug];
  const z = (packZh as Record<string, Fields>)[slug];
  if (e && z) {
    industryZh[e.industry] = z.industry;
    sectorZh[e.sector] = z.sector;
  }
}

const NAME_ZH: Record<string, string> = {
  "dlocal-crossborder": "新兴市场收款",
  "stripe-atlas-rails": "Atlas 公司设立轨道",
  "notion-ops-stack": "Workspace 运营栈",
  "canva-design-os": "视觉设计 OS",
  "shopify-merchant-os": "商户电商 OS",
  "revolut-neo-bank": "无国界新银行",
  "klarna-bnpl-rails": "灵活结账轨道",
  "spotify-audio-graph": "音频发现图谱",
  "industrial-climate-os": "工业气候 OS",
  "wise-fx-corridor": "透明外汇走廊",
  "rappi-super-app": "拉美超级应用",
  "nubank-digital-bank": "紫色数字银行",
  "mercadolibre-commerce": "拉美电商图谱",
  "grab-sea-superapp": "东南亚出行超级应用",
  "gojek-tokopedia": "群岛超级平台",
  "paytm-india-wallet": "印度支付织物",
  "razorpay-merchant": "商户收款栈",
  "flutterwave-africa": "非洲支付网络",
  "paystack-africa": "非洲商户支付",
  "tabby-bnpl-gcc": "海湾先买后付",
  "careem-middle-east": "中东出行超级应用",
  "yassir-maghreb": "马格里布超级应用",
  "bolt-estonia": "欧洲出行网络",
  "wolt-delivery": "本地即时配送",
  "sea-shopee": "东南亚电商引擎",
  "tokopedia-market": "群岛市场平台",
  "coupang-rocket": "火箭电商履约",
  "shein-fast-fashion": "快时尚供应链",
  "canva-affinity": "专业创意套件",
  "figma-design-collab": "协作设计画布",
  "miro-whiteboard": "远程白板协作",
  "airtable-ops-db": "运营数据库",
  "atlassian-work": "团队协作套件",
  "gitlab-devops": "一体化 DevOps",
  "hashicorp-infra": "基础设施即代码",
  "vercel-frontend": "前端云平台",
  "supabase-backend": "开源后端即服务",
  "sentry-observability": "应用可观测性",
  "databricks-lakehouse": "湖仓一体平台",
  "openai-platform": "大模型平台",
  "anthropic-claude": "安全对齐模型",
  "mistral-europe-ai": "欧洲开源模型",
  "deepmind-science": "科学智能引擎",
  "cognition-devin": "自主软件工程师",
  "cursor-coding": "AI 结对编程",
  "perplexity-answer": "答案引擎",
  "runway-ml-video": "生成式视频工作室",
  "elevenlabs-voice": "生成式语音",
  "ui-path-rpa": "企业 RPA 自动化",
  "celonis-process": "流程挖掘智能",
  "personio-hr-eu": "欧洲 HR 套件",
  "pleo-spend": "智能支出卡",
  "qonto-sme-bank": "中小企业银行",
  "swan-banking-as-a-service": "银行即服务",
  "adyen-acquiring": "全球收单网络",
  "checkout-com": "全球支付编排",
  "pieter-patreon-creators": "创作者会员轨道",
  "hopin-events": "虚拟活动平台",
  "loom-async-video": "异步视频消息",
  "intercom-support": "客户沟通平台",
  "hubspot-crm": "增长型 CRM",
  "freshworks-crm": "中小企业 CRM",
  "zoho-suite": "一体化商务套件",
  "xero-accounting": "云会计平台",
  "contentful-cms": "无头内容平台",
  "webflow-sites": "可视化建站",
  "andela-talent": "全球技术人才网络",
  "alan-health": "欧洲数字医保",
  "doctors-without-wait": "即时问诊网络",
  "vtex-commerce": "企业电商平台",
  "bytedance-creator-os": "创作者操作系统",
};

const DESC_ZH: Record<string, string> = {
  "dlocal-crossborder": "跨境支付编排，帮助全球商户在新兴市场用本地支付方式收款。",
  "pieter-patreon-creators": "让创作者用会员订阅向粉丝变现的工具与账单轨道。",
  "stripe-atlas-rails": "帮助创始人远程设立公司、完成合规与银行开户的编排轨道。",
  "revolut-neo-bank": "多币种账户与跨境消费的新银行体验。",
  "wise-fx-corridor": "透明费率的跨境汇款与多币种账户走廊。",
  "nubank-digital-bank": "以移动端为先的数字银行，服务大众零售与信贷。",
  "grab-sea-superapp": "整合出行、外卖与金融的东南亚超级应用。",
  "openai-platform": "面向开发者与企业的大语言模型与 API 平台。",
  "cursor-coding": "把 AI 结对编程嵌入本地开发工作流的代码编辑器。",
  "shopify-merchant-os": "面向独立站商户的电商操作系统：店面、结账与履约工具。",
  "klarna-bnpl-rails": "为电商结账提供分期与先买后付的灵活支付轨道。",
  "flutterwave-africa": "连接非洲商户与全球支付方式的收款网络。",
  "paystack-africa": "面向非洲商户的在线收款与本地支付方式接入。",
  "adyen-acquiring": "服务全球商户的统一收单与支付处理网络。",
  "checkout-com": "为平台与商户提供的全球支付编排与本地收单能力。",
  "notion-ops-stack": "面向团队的工作区运营栈，把文档、任务与知识库连成一体。",
  "figma-design-collab": "实时协作的专业设计画布与组件系统。",
  "databricks-lakehouse": "统一数据分析、工程与 AI 的湖仓一体平台。",
  "hubspot-crm": "面向增长团队的入站营销与 CRM 平台。",
  "andela-talent": "连接全球技术人才与企业工程团队的人才网络。",
};

const GO_ZH: Record<string, string> = {
  "Partner as Africa pay-in specialist under dLocal rails.":
    "在 dLocal 轨道下以非洲收款专家身份合作。",
};

const SECTOR_FALLBACK: Record<string, string> = {
  "Cross-border Payments": "跨境支付",
  "Creator Economy": "创作者经济",
  "Neo Bank": "新银行",
  "Digital Bank": "数字银行",
  Superapp: "超级应用",
  Marketplace: "市场平台",
  "Foundation Models": "基础模型",
  DevOps: "DevOps",
  Observability: "可观测性",
  CRM: "客户关系管理",
  Accounting: "会计",
  Telemedicine: "远程医疗",
  "E-commerce Platform": "电商平台",
  "Payment Orchestration": "支付编排",
  "Banking-as-a-Service": "银行即服务",
  "Spend Management": "支出管理",
  "Process Mining": "流程挖掘",
  "Talent Marketplace": "人才市场",
  "Website Builder": "建站工具",
  "Async Video": "异步视频",
  "Virtual Events": "虚拟活动",
  "Customer Support": "客户支持",
  Acquiring: "收单",
  BNPL: "先买后付",
};

function sectorZhOf(s: string) {
  return sectorZh[s] || SECTOR_FALLBACK[s] || s;
}

function zhBiz(s: string) {
  if (/Payment fees|FX/i.test(s)) return "支付手续费 + 外汇价差。";
  if (/Platform fee/i.test(s)) return "平台抽成。";
  if (/Subscription|SaaS/i.test(s)) return "订阅 / SaaS 收费。";
  if (/Take rate|commission/i.test(s)) return "交易抽成。";
  return s ? `商业模式：${s}` : "";
}

function zhFunding(n: string) {
  if (!n) return "";
  if (/Public company/i.test(n)) return "上市公司";
  return n;
}

function toTw(s: string) {
  return s
    .replace(/营/g, "營")
    .replace(/业/g, "業")
    .replace(/国/g, "國")
    .replace(/场/g, "場")
    .replace(/数/g, "數")
    .replace(/库/g, "庫")
    .replace(/开/g, "開")
    .replace(/发/g, "發")
    .replace(/计/g, "計")
    .replace(/设/g, "設")
    .replace(/创/g, "創")
    .replace(/银/g, "銀")
    .replace(/帮助/g, "幫助")
    .replace(/市场/g, "市場")
    .replace(/订阅/g, "訂閱")
    .replace(/账户/g, "帳戶")
    .replace(/网络/g, "網絡")
    .replace(/设计/g, "設計")
    .replace(/创作者/g, "創作者")
    .replace(/编排/g, "編排")
    .replace(/运营/g, "運營")
    .replace(/前进/g, "前進")
    .replace(/路径/g, "路徑");
}

let added = 0;
for (const idea of ideas) {
  en[idea.slug] = fields(idea);
  if (!zh[idea.slug]) {
    const name = NAME_ZH[idea.slug] || idea.name;
    zh[idea.slug] = {
      name,
      description: DESC_ZH[idea.slug] || `${name}：${idea.description}`,
      businessModel: zhBiz(idea.businessModel),
      industry: industryZh[idea.industry] || idea.industry,
      sector: sectorZhOf(idea.sector),
      fundingRoundNote: zhFunding(idea.fundingRoundNote || ""),
      goForwardSummary:
        GO_ZH[idea.goForward.summary] ||
        (idea.goForward.summary ? `前进路径：${idea.goForward.summary}` : ""),
    };
    added += 1;
  }
  if (!zhTW[idea.slug] && zh[idea.slug]) {
    const z = zh[idea.slug];
    zhTW[idea.slug] = {
      name: toTw(z.name),
      description: toTw(z.description),
      businessModel: toTw(z.businessModel),
      industry: toTw(z.industry),
      sector: toTw(z.sector),
      fundingRoundNote: toTw(z.fundingRoundNote),
      goForwardSummary: toTw(z.goForwardSummary),
    };
  }
}

writeFileSync("lib/i18n/idea-packs/en.json", JSON.stringify(en, null, 2) + "\n");
writeFileSync("lib/i18n/idea-packs/zh-CN.json", JSON.stringify(zh, null, 2) + "\n");
writeFileSync("lib/i18n/idea-packs/zh-TW.json", JSON.stringify(zhTW, null, 2) + "\n");
console.log(
  JSON.stringify({
    total: ideas.length,
    en: Object.keys(en).length,
    zh: Object.keys(zh).length,
    added,
    dlocal: zh["dlocal-crossborder"],
  }),
);
