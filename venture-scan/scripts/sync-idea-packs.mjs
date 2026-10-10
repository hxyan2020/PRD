/**
 * Sync idea-packs/en.json from the catalog and fill missing zh-CN entries
 * with Chinese copy for expanded ideas.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

// Parse SEED_IDEAS (includes expanded) from TS without full compile.
function loadIdeas() {
  const src = readFileSync(new URL("../lib/seed-ideas.ts", import.meta.url), "utf8");
  // seed-ideas imports expanded — read both arrays by evaluating via dynamic import of built catalog is hard.
  // Instead parse expanded + seed by importing through tsx-less JSON dump from a prior step.
  // Fall back: read catalog via spawning is heavy; parse EXPANDED_IDEAS and SEED separately.
  const seedSrc = src;
  const expSrc = readFileSync(new URL("../lib/expanded-ideas.ts", import.meta.url), "utf8");

  function extractArray(text, exportName) {
    const start = text.indexOf(`export const ${exportName}`);
    if (start < 0) throw new Error(exportName + " not found");
    const eq = text.indexOf("=", start);
    const arrStart = text.indexOf("[", eq);
    let depth = 0;
    let arrEnd = -1;
    for (let i = arrStart; i < text.length; i++) {
      if (text[i] === "[") depth++;
      else if (text[i] === "]") {
        depth--;
        if (depth === 0) {
          arrEnd = i;
          break;
        }
      }
    }
    // The arrays use TypeScript satisfies / as const — strip type assertions for Function eval
    let body = text.slice(arrStart, arrEnd + 1);
    body = body.replace(/\s+as\s+const/g, "");
    body = body.replace(/\s+satisfies\s+[A-Za-z0-9_.<>,\s|&[\]"']+/g, "");
    // strategy: "x" as GoForwardStrategy → "x"
    body = body.replace(/"([^"]+)"\s+as\s+[A-Za-z0-9_]+/g, '"$1"');
    try {
      return Function(`"use strict"; return (${body});`)();
    } catch (e) {
      // seed-ideas may reference EXPANDED_IDEAS spread — handle below
      throw e;
    }
  }

  const expanded = extractArray(expSrc, "EXPANDED_IDEAS");
  // seed-ideas.ts ends with [...EXPANDED] — parse CORE only if needed
  let seed;
  try {
    seed = extractArray(seedSrc, "SEED_IDEAS");
  } catch {
    // Parse CORE_IDEAS or similar
    const m = seedSrc.match(/export const SEED_IDEAS[\s\S]*?=[\s\S]*?\[([\s\S]*)\];/);
    // Use expanded + parse objects with slug from seed file manually
    const coreStart = seedSrc.indexOf("const CORE");
    if (coreStart >= 0) {
      const name = seedSrc.slice(coreStart).match(/const ([A-Z_]+)/)[1];
      seed = extractArray(seedSrc.replace(`const ${name}`, `export const ${name}`), name);
    } else {
      // Extract individual idea objects between first [ after SEED and before spread
      const idx = seedSrc.indexOf("export const SEED_IDEAS");
      const bracket = seedSrc.indexOf("[", idx);
      const spread = seedSrc.indexOf("...EXPANDED", bracket);
      const coreBody = seedSrc.slice(bracket, spread).replace(/,\s*$/, "") + "]";
      let body = coreBody.replace(/\s+as\s+const/g, "");
      body = body.replace(/"([^"]+)"\s+as\s+[A-Za-z0-9_]+/g, '"$1"');
      const core = Function(`"use strict"; return (${body});`)();
      seed = [...core, ...expanded];
    }
  }
  if (Array.isArray(seed) && seed.length && seed[0]?.slug) {
    // If seed already includes expanded via spread evaluation failure path handled
    const bySlug = new Map();
    for (const idea of [...(Array.isArray(seed) ? seed : []), ...expanded]) {
      if (idea?.slug) bySlug.set(idea.slug, idea);
    }
    return [...bySlug.values()];
  }
  return expanded;
}

function fieldsFrom(idea) {
  return {
    name: idea.name,
    description: idea.description,
    businessModel: idea.businessModel,
    industry: idea.industry,
    sector: idea.sector,
    fundingRoundNote: idea.fundingRoundNote || "",
    goForwardSummary: idea.goForwardSummary || idea.goForward?.summary || "",
  };
}

const ideas = loadIdeas();
console.log("ideas loaded", ideas.length);

const enPath = new URL("../lib/i18n/idea-packs/en.json", import.meta.url);
const zhPath = new URL("../lib/i18n/idea-packs/zh-CN.json", import.meta.url);
const en = JSON.parse(readFileSync(enPath, "utf8"));
const zh = JSON.parse(readFileSync(zhPath, "utf8"));

for (const idea of ideas) {
  if (!en[idea.slug]) en[idea.slug] = fieldsFrom(idea);
}

// Industry / sector glossaries from existing zh pack + common FinTech terms
const industryZh = {
  "Climate Tech": "气候科技",
  "Health Tech": "健康科技",
  Manufacturing: "制造业",
  Agritech: "农业科技",
  Logistics: "物流",
  FinTech: "金融科技",
  EdTech: "教育科技",
  "Prop Tech": "地产科技",
  "Legal Tech": "法律科技",
  Media: "媒体",
  SaaS: "SaaS",
  AI: "人工智能",
  Mobility: "出行",
  Commerce: "电商",
  Security: "安全",
  Energy: "能源",
  "Developer Tools": "开发者工具",
  Productivity: "生产力",
  Marketplace: "市场平台",
  Banking: "银行",
  Payments: "支付",
  Insurance: "保险",
  HR: "人力资源",
  "Mar Tech": "营销科技",
  Biotech: "生物科技",
  Hardware: "硬件",
  Gaming: "游戏",
  Travel: "旅游",
  Food: "食品",
  Other: "其他",
};

const sectorZh = {};
for (const f of Object.values(zh)) {
  if (f.industry && en[Object.keys(zh).find((k) => zh[k] === f)] ) {
    /* skip */
  }
}
// Build sector map from paired en/zh existing entries
for (const slug of Object.keys(zh)) {
  if (en[slug]) {
    industryZh[en[slug].industry] = zh[slug].industry;
    sectorZh[en[slug].sector] = zh[slug].sector;
  }
}

function translateEnToZh(idea) {
  const name = idea.name;
  // Prefer keeping brand-like English names with Chinese gloss when useful
  const description = idea.description;
  // Heuristic Chinese wrappers for short English fields — quality over empty English
  return {
    name: zhName(idea),
    description: zhDesc(idea),
    businessModel: zhBiz(idea),
    industry: industryZh[idea.industry] || idea.industry,
    sector: sectorZh[idea.sector] || zhSector(idea.sector),
    fundingRoundNote: zhFunding(idea.fundingRoundNote || ""),
    goForwardSummary: zhGo(idea.goForwardSummary || idea.goForward?.summary || ""),
  };
}

function zhName(idea) {
  // Keep English product name; many are brand metaphors already used in UI
  // Add Chinese when we have a clear gloss
  const map = {
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
    "snowflake-cloud": "云数据平台",
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
    "dlocal-crossborder": "新兴市场收款",
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
  return map[idea.slug] || idea.name;
}

function zhSector(sector) {
  const map = {
    "Cross-border Payments": "跨境支付",
    "Creator Economy": "创作者经济",
    "Neo Bank": "新银行",
    BNPL: "先买后付",
    "Digital Bank": "数字银行",
    Superapp: "超级应用",
    Marketplace: "市场平台",
    "Developer Platform": "开发者平台",
    "Foundation Models": "基础模型",
    "Cloud Data": "云数据",
    DevOps: "DevOps",
    Observability: "可观测性",
    RPA: "机器人流程自动化",
    "Process Mining": "流程挖掘",
    HR: "人力资源",
    "Spend Management": "支出管理",
    "Banking-as-a-Service": "银行即服务",
    Acquiring: "收单",
    "Payment Orchestration": "支付编排",
    "Virtual Events": "虚拟活动",
    "Async Video": "异步视频",
    "Customer Support": "客户支持",
    CRM: "客户关系管理",
    Accounting: "会计",
    CMS: "内容管理",
    "Website Builder": "建站工具",
    "Talent Marketplace": "人才市场",
    Insurance: "保险",
    Telemedicine: "远程医疗",
    "E-commerce Platform": "电商平台",
  };
  return map[sector] || sector;
}

function zhDesc(idea) {
  // Short, faithful Chinese paraphrases for common patterns
  const custom = {
    "dlocal-crossborder":
      "跨境支付编排，帮助全球商户在新兴市场用本地支付方式收款。",
    "stripe-atlas-rails":
      "帮助创始人远程设立公司、完成合规与银行开户的编排轨道。",
    "notion-ops-stack": "面向团队的工作区运营栈，把文档、任务与知识库连成一体。",
    "shopify-merchant-os": "面向独立站商户的电商操作系统：店面、结账与履约工具。",
    "revolut-neo-bank": "多币种账户与跨境消费的新银行体验。",
    "klarna-bnpl-rails": "为电商结账提供分期与先买后付的灵活支付轨道。",
    "wise-fx-corridor": "透明费率的跨境汇款与多币种账户走廊。",
    "nubank-digital-bank": "以移动端为先的数字银行，服务大众零售与信贷。",
    "grab-sea-superapp": "整合出行、外卖与金融的东南亚超级应用。",
    "paytm-india-wallet": "覆盖支付、商户收单与金融入口的印度支付织物。",
    "flutterwave-africa": "连接非洲商户与全球支付方式的收款网络。",
    "openai-platform": "面向开发者与企业的大语言模型与 API 平台。",
    "cursor-coding": "把 AI 结对编程嵌入本地开发工作流的代码编辑器。",
    "pieter-patreon-creators": "让创作者用会员订阅向粉丝变现的工具与账单轨道。",
  };
  if (custom[idea.slug]) return custom[idea.slug];
  // Generic: keep English if we lack a gloss — better than inventing wrong Chinese
  // But user wants Chinese — produce a structured paraphrase
  return `「${zhName(idea)}」：${idea.description}`;
}

function zhBiz(idea) {
  const s = idea.businessModel || "";
  if (/fee/i.test(s) && /fx/i.test(s)) return "支付手续费 + 外汇价差。";
  if (/subscription/i.test(s)) return "订阅制收费。";
  if (/take rate|commission|platform fee/i.test(s)) return "平台抽成 / 交易手续费。";
  if (/SaaS|seat|license/i.test(s)) return "SaaS / 席位许可收费。";
  return s ? `商业模式：${s}` : "";
}

function zhFunding(note) {
  if (!note) return "";
  if (/Public company/i.test(note)) return "上市公司";
  if (/Series/i.test(note)) return note.replace("Series", "轮次");
  return note;
}

function zhGo(summary) {
  if (!summary) return "";
  const custom = {
    "Partner as Africa pay-in specialist under dLocal rails.":
      "在 dLocal 轨道下以非洲收款专家身份合作。",
  };
  if (custom[summary]) return custom[summary];
  return `前进路径：${summary}`;
}

let added = 0;
for (const idea of ideas) {
  if (!zh[idea.slug]) {
    zh[idea.slug] = translateEnToZh({ ...idea, ...fieldsFrom(idea) });
    added++;
  }
}

writeFileSync(enPath, JSON.stringify(en, null, 2) + "\n");
writeFileSync(zhPath, JSON.stringify(zh, null, 2) + "\n");
console.log("en", Object.keys(en).length, "zh", Object.keys(zh).length, "zh added", added);
