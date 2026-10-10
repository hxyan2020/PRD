#!/usr/bin/env node
/**
 * Overwrite zh-CN / zh-TW idea-pack fields that still contain English copy.
 */
import { readFileSync, writeFileSync } from "fs";

const en = JSON.parse(readFileSync("lib/i18n/idea-packs/en.json", "utf8"));
const zh = JSON.parse(readFileSync("lib/i18n/idea-packs/zh-CN.json", "utf8"));

const INDUSTRY = {
  AI: "人工智能",
  AgriTech: "农业科技",
  "Climate Tech": "气候科技",
  Cybersecurity: "网络安全",
  DevTools: "开发者工具",
  "E-commerce": "电商",
  EdTech: "教育科技",
  Energy: "能源",
  "Enterprise Software": "企业软件",
  FinTech: "金融科技",
  "Food Tech": "食品科技",
  "HR Tech": "人力资源科技",
  "Health Tech": "健康科技",
  "Legal Tech": "法律科技",
  "Logistics Tech": "物流科技",
  Manufacturing: "制造业",
  MarTech: "营销科技",
  Media: "媒体",
  Mobility: "出行",
  Productivity: "生产力",
  SaaS: "SaaS",
  Banking: "银行",
  Payments: "支付",
  Security: "安全",
  Commerce: "电商",
  Biotech: "生物科技",
  Hardware: "硬件",
  Gaming: "游戏",
  Travel: "旅游",
  Food: "食品",
  Logistics: "物流",
  Insurance: "保险",
  HR: "人力资源",
};

const SECTOR = {
  "AI Coding": "AI 编程",
  Accounting: "会计",
  "Aging Care / Consumer": "养老 / 消费",
  "Alternative Proteins": "替代蛋白",
  "Async Collaboration": "异步协作",
  "Audio Streaming": "音频流媒体",
  Automation: "自动化",
  "Backend Platforms": "后端平台",
  "Banking-as-a-Service": "银行即服务",
  "Battery Circularity": "电池循环",
  "Blue Economy / Biodiversity Credits": "蓝色经济 / 生物多样性信用",
  "Business Banking": "对公银行",
  "Business Suites": "商务套件",
  CMS: "内容管理系统",
  CRM: "客户关系管理",
  "Cold Chain Logistics": "冷链物流",
  Collaboration: "协作",
  "Collaborative Software": "协作软件",
  "Commerce Platforms": "电商平台",
  "Consumer Credit": "消费信贷",
  "Creative Automation": "创意自动化",
  "Creative Tools": "创意工具",
  "Creator Economy": "创作者经济",
  "Cross-border Payments": "跨境支付",
  "Customer Support": "客户支持",
  "Data Platforms": "数据平台",
  "Design Tools": "设计工具",
  DevSecOps: "DevSecOps",
  "DevSecOps / GRC": "DevSecOps / 治理合规",
  "Developer Agents": "开发者智能体",
  "Digital Banking": "数字银行",
  "Distributed Energy": "分布式能源",
  "Distributed Fabrication": "分布式制造",
  "ESG / Supply Chain": "ESG / 供应链",
  "EV Battery Infrastructure": "电动车电池基础设施",
  Events: "活动",
  "Fashion Retail": "时尚零售",
  "Food Delivery": "外卖配送",
  "Foundation Models": "基础模型",
  "Frontend Cloud": "前端云",
  "Generative Media": "生成式媒体",
  HRIS: "人力资源信息系统",
  "Hospital Workflow AI": "医院流程 AI",
  "Industrial Decarbonization": "工业脱碳",
  Infrastructure: "基础设施",
  InsurTech: "保险科技",
  "K-12 Hands-on Learning": "K-12 动手学习",
  "Logistics Commerce": "物流电商",
  Marketplaces: "市场平台",
  "Merchant Payments": "商户支付",
  "Merchant Platforms": "商户平台",
  "Multi-service Platforms": "多服务平台",
  "No-Code Platforms": "无代码平台",
  Observability: "可观测性",
  "On-demand Delivery": "即时配送",
  "On-demand Platforms": "按需服务平台",
  Payments: "支付",
  "Practice Management": "执业管理",
  "Primary Care Access": "基层医疗可及",
  "Process Intelligence": "流程智能",
  "Research Platforms": "研究平台",
  "Residential Retrofit": "住宅节能改造",
  "Ride-hailing": "网约车",
  "SMB Payments / Embedded Finance": "中小商户支付 / 嵌入式金融",
  Search: "搜索",
  "Short Video": "短视频",
  "Spend Management": "支出管理",
  "Startup Infrastructure": "创业基础设施",
  "Talent Marketplaces": "人才市场",
  Telehealth: "远程医疗",
  "Trade Compliance SaaS": "贸易合规 SaaS",
  "Voice AI": "语音 AI",
  "Website Builders": "建站工具",
  "Wildfire Detection": "野火监测",
  "Work Management": "工作管理",
  "Neo Bank": "新银行",
  Superapp: "超级应用",
  Marketplace: "市场平台",
  DevOps: "DevOps",
  "E-commerce Platform": "电商平台",
  "Payment Orchestration": "支付编排",
  "Process Mining": "流程挖掘",
  "Talent Marketplace": "人才市场",
  "Website Builder": "建站工具",
  "Async Video": "异步视频",
  "Virtual Events": "虚拟活动",
  Acquiring: "收单",
  BNPL: "先买后付",
};

const DESC = {
  "reef-credit-exchange":
    "将经过核验的珊瑚礁修复成果代币化，并向酒店、保险公司与沿海政府出售生物多样性信用的市场平台。",
  "farmstack-coldchain":
    "面向小农户农产品集货商的太阳能模块冷库与物联网损耗传感器，按箱租用仓位，买家通过 WhatsApp 与应用获取品质保障供应窗口。",
  "ledgerlane-freight":
    "为跨境中小出口商自动生成报关包、提单与合规轨迹的 AI 单证层，可对接 WhatsApp 文件投递与常见 ERP。",
  "voltpath-depot":
    "面向末端配送车队的标准化电池换电站：快递员两分钟内完成换电，VoltPath 持有电池库存并以能源即服务卖给物流品牌。",
  "cuecraft-ads":
    "生成式广告工作室：输入商品链接即可产出适配 Meta、TikTok、小红书的本地化创意包，并按市场做话术合规检查。",
  "spore-kitchen":
    "用精准发酵生产与乳品同质的冰淇淋与奶精蛋白，向寻求更清晰 Scope 3 叙事的 CPG 品牌供应 B2B 原料。",
  "atelier-carbon-ledger":
    "面向法国奢侈品牌的 Scope-3 核算操作系统，把供应商工坊、材料与物流映射为可审计的碳台账以支持 CSRD 披露。",
  "mercado-voice-pos":
    "面向墨西哥便利店与街头商贩的语音优先收银：用西班牙语口述库存与销售，同步 WhatsApp 小票并解锁微型营运资金。",
  "cape-clinic-triage":
    "WhatsApp + USSD 分诊机器人，把乡镇患者分流到合适诊所队列，并为开普敦都会区诊所提供护士看板与救护车 ETA。",
  "canva-design-os":
    "浏览器端设计套件，让中小企业无需专职设计团队也能产出本地化创意——模板、品牌套件与智能尺寸适配。",
  "spotify-audio-graph":
    "连接播客、音乐与创作者变现的个性化音频图谱，服务全球听众。",
  "industrial-climate-os":
    "映射工厂能耗、碳强度与改造回报的软件，服务面临 CSRD 压力的欧洲制造商。",
  "rappi-super-app":
    "覆盖拉美主要城市的即时配送、支付与金融钱包，横跨生鲜、餐饮与末端配送。",
  "mercadolibre-commerce":
    "连接西语与葡语美洲买卖双方的市场 + 物流 + 金融科技生态。",
  "gojek-tokopedia":
    "面向印尼消费者的按需服务与市场组合，覆盖出行、餐饮与电商。",
  "paytm-india-wallet":
    "连接印度数字支付经济的消费者钱包、UPI 轨道与商户收单栈。",
  "razorpay-merchant":
    "面向印度创业公司与中小企业的支付网关、发薪与银行 API。",
  "bytedance-creator-os":
    "短视频平台，配备创作者基金、直播电商与面向全球受众的推荐引擎。",
  "shein-fast-fashion":
    "数据驱动的服饰设计到消费者闭环：小批量试款并把赢家规模化到全球。",
  "coupang-rocket":
    "自建物流的电商，承诺韩国次日达并向海外扩张。",
  "tokopedia-market":
    "聚焦印尼的市场平台，通过物流与支付合作方连接中小微企业与消费者。",
  "sea-shopee":
    "在东南亚商户渗透深厚的市场与游戏联动电商网络。",
  "yassir-maghreb":
    "面向北非城市的网约车、配送与支付，阿拉伯语优先体验。",
  "careem-middle-east":
    "覆盖中东与巴基斯坦走廊的网约车、配送与汇款服务。",
  "tabby-bnpl-gcc":
    "嵌入海湾时尚与数码结账的合规友好分期购物。",
  "vtex-commerce":
    "帮助零售商在拉美及全球市场现代化店面的企业电商平台。",
  "airtable-ops-db":
    "表格与数据库混合体，让运营团队无需提工程工单即可建模工作流。",
  "anthropic-claude":
    "强调可控性与长上下文的企业级大语言模型与工具。",
  "mistral-europe-ai":
    "在欧洲打造的开源权重与商业前沿模型，服务重视主权的买家。",
  "deepmind-science":
    "面向科学、生物与复杂系统的研究型 AI，并开展企业合作。",
  "personio-hr-eu":
    "覆盖招聘、薪酬与人事运营的欧洲中小企业一体化 HRIS，含本地合规。",
  "contentful-cms":
    "无头 CMS，让全球品牌用结构化模型发布全渠道内容。",
  "celonis-process":
    "重建企业真实运转过程并发现自动化回报的流程挖掘平台。",
  "ui-path-rpa":
    "机器人流程自动化与 AI 智能体，把重复桌面与 API 工作从人工队列中剥离。",
  "hashicorp-infra":
    "Terraform 与密钥工具，为平台工程团队标准化云资源供给。",
  "gitlab-devops":
    "从规划到部署的端到端 DevSecOps 平台，内置安全扫描。",
  "sentry-observability":
    "在用户流失前捕获生产错误与性能回退的开发者可观测性平台。",
  "vercel-frontend":
    "面向 Next.js 与现代前端的部署平台，含边缘网络与预览工作流。",
  "supabase-backend":
    "基于 Postgres 的后端即服务，提供认证、存储与实时能力，适合独立开发者与创业团队。",
  "pleo-spend":
    "面向欧洲中小企业的企业卡与支出管理，可自动同步记账。",
  "hopin-events":
    "混合会议活动平台，含主会场、展厅与社交房间。",
  "bolt-estonia":
    "网约车与微出行，并在欧洲与非洲扩展外卖配送。",
  "wolt-delivery":
    "北欧与中东欧城市密度高的餐饮与零售配送平台（现属 DoorDash）。",
  "swan-banking-as-a-service":
    "银行即服务 API，让欧洲金融科技与平台嵌入账户与卡片。",
  "qonto-sme-bank":
    "面向欧洲自由职业者与中小企业的对公账户、卡片与记账。",
  "alan-health":
    "面向欧洲雇员与自由职业者的移动优先健康保险与就医导航。",
  "doctors-without-wait":
    "基于应用的基层医疗与心理健康问诊，缩短都市白领诊所等待时间。",
  "cognition-devin":
    "把待办工单做到拉取请求的 AI 软件工程师智能体，服务产品团队。",
  "runway-ml-video":
    "创作者与工作室用于快速内容迭代的 AI 视频生成与剪辑工具。",
  "elevenlabs-voice":
    "高保真 AI 语音生成与配音，服务创作者、游戏与本地化团队。",
  "perplexity-answer":
    "结合搜索与生成式 AI、带引用的答案引擎，用于研究与决策。",
  "loom-async-video":
    "轻量屏幕与摄像头录制，用异步更新替代状态同步会议。",
  "miro-whiteboard":
    "用于工作坊、产品发现与分布式团队引导的在线白板。",
  "webflow-sites":
    "可视化开发平台，打造营销站与 Web 应用而无需传统 CMS 瓶颈。",
  "intercom-support":
    "融合收件箱、帮助中心与 AI 智能体的客户支持平台。",
  "atlassian-work":
    "Jira、Confluence 等工具，组织全球企业软件交付。",
  "xero-accounting":
    "面向小企业的在线会计，含银行流水、开票与会计师生态。",
  "canva-affinity":
    "模板驱动的创意平台路径，仍被诸多区域设计工具效仿以打入中小企业。",
  "freshworks-crm":
    "面向中端市场的 CRM 与支持套件，追求 Salesforce 能力但更轻量。",
  "zoho-suite":
    "源自印度的宽覆盖生产力与运营套件，横跨 CRM、邮件与财务，服务成本敏感型中小企业。",
  "stripe-atlas-rails": "帮助创始人远程设立公司、完成合规与银行开户的编排轨道。",
  "notion-ops-stack": "面向团队的工作区运营栈，把文档、任务与知识库连成一体。",
  "shopify-merchant-os": "面向独立站商户的电商操作系统：店面、结账与履约工具。",
  "revolut-neo-bank": "多币种账户与跨境消费的新银行体验。",
  "klarna-bnpl-rails": "为电商结账提供分期与先买后付的灵活支付轨道。",
  "wise-fx-corridor": "透明费率的跨境汇款与多币种账户走廊。",
  "nubank-digital-bank": "以移动端为先的数字银行，服务大众零售与信贷。",
  "grab-sea-superapp": "整合出行、外卖与金融的东南亚超级应用。",
  "flutterwave-africa": "连接非洲商户与全球支付方式的收款网络。",
  "paystack-africa": "面向非洲商户的在线收款与本地支付方式接入。",
  "dlocal-crossborder": "跨境支付编排，帮助全球商户在新兴市场用本地支付方式收款。",
  "pieter-patreon-creators": "让创作者用会员订阅向粉丝变现的工具与账单轨道。",
  "figma-design-collab": "实时协作的专业设计画布与组件系统。",
  "databricks-lakehouse": "统一数据分析、工程与 AI 的湖仓一体平台。",
  "hubspot-crm": "面向增长团队的入站营销与 CRM 平台。",
  "andela-talent": "连接全球技术人才与企业工程团队的人才网络。",
  "openai-platform": "面向开发者与企业的大语言模型与 API 平台。",
  "cursor-coding": "把 AI 结对编程嵌入本地开发工作流的代码编辑器。",
  "adyen-acquiring": "服务全球商户的统一收单与支付处理网络。",
  "checkout-com": "为平台与商户提供的全球支付编排与本地收单能力。",
};

function hasHeavyEnglish(s) {
  if (!s) return true;
  const letters = (s.match(/[A-Za-z]/g) || []).length;
  const cjk = (s.match(/[\u4e00-\u9fff]/g) || []).length;
  return letters > 24 && letters > cjk;
}

function zhBiz(s) {
  if (!s) return "";
  if (/Payment fees|FX/i.test(s)) return "支付手续费 + 外汇价差。";
  if (/Platform fee|Take rate|commission/i.test(s)) return "平台抽成 / 交易抽成。";
  if (/Subscription|SaaS/i.test(s)) return "订阅 / SaaS 收费。";
  if (/Interest|spread/i.test(s)) return "利息与价差收入。";
  if (/Transaction|fee/i.test(s)) return "交易手续费。";
  if (hasHeavyEnglish(s)) return `商业模式：基于${s.includes("API") ? " API 与用量 " : "核心产品 "}收费。`;
  return s;
}

function zhFunding(n) {
  if (!n) return "";
  if (/Public company/i.test(n)) return "上市公司";
  if (/Series/i.test(n) && hasHeavyEnglish(n)) return n.replace(/Series /g, "轮次 ");
  return n;
}

function zhGo(summary, name) {
  if (!summary) return "";
  if (!hasHeavyEnglish(summary) && /[\u4e00-\u9fff]/.test(summary)) {
    return summary.replace(/^前进路径：/, "");
  }
  // Keep strategy intent short in Chinese when English summary remains.
  return `围绕「${name}」推进本地化或垂直拆分路径。`;
}

function toTw(s) {
  if (!s) return s;
  const map = {
    营: "營",
    业: "業",
    国: "國",
    场: "場",
    数: "數",
    库: "庫",
    开: "開",
    发: "發",
    计: "計",
    设: "設",
    创: "創",
    银: "銀",
    帮助: "幫助",
    市场: "市場",
    订阅: "訂閱",
    账户: "帳戶",
    网络: "網絡",
    设计: "設計",
    编排: "編排",
    运营: "運營",
    前进: "前進",
    路径: "路徑",
    软件: "軟體",
    信息: "資訊",
    数据: "資料",
    视频: "視頻",
    默认: "預設",
    针对: "針對",
    连接: "連接",
    面向: "面向",
    服务: "服務",
    平台: "平臺",
    应用: "應用",
    体验: "體驗",
    客户: "客戶",
    企业: "企業",
    团队: "團隊",
    内容: "內容",
    电商: "電商",
    支付: "支付",
    配送: "配送",
    物流: "物流",
    金融: "金融",
    科技: "科技",
    智能: "智慧",
    自动化: "自動化",
    基础设施: "基礎設施",
  };
  let out = s;
  for (const [a, b] of Object.entries(map)) out = out.split(a).join(b);
  return out;
}

let fixed = 0;
for (const [slug, e] of Object.entries(en)) {
  const cur = zh[slug] || {
    name: e.name,
    description: e.description,
    businessModel: e.businessModel,
    industry: e.industry,
    sector: e.sector,
    fundingRoundNote: e.fundingRoundNote || "",
    goForwardSummary: e.goForwardSummary || "",
  };
  const name = cur.name && /[\u4e00-\u9fff]/.test(cur.name) ? cur.name : e.name;
  const next = {
    name,
    description: DESC[slug] || (!hasHeavyEnglish(cur.description) ? cur.description : `${name}：相关产品与商业模式的本地化机会。`),
    businessModel: !hasHeavyEnglish(cur.businessModel) ? cur.businessModel : zhBiz(e.businessModel),
    industry: INDUSTRY[e.industry] || (!hasHeavyEnglish(cur.industry) ? cur.industry : e.industry),
    sector: SECTOR[e.sector] || (!hasHeavyEnglish(cur.sector) ? cur.sector : e.sector),
    fundingRoundNote: zhFunding(cur.fundingRoundNote || e.fundingRoundNote || ""),
    goForwardSummary: zhGo(cur.goForwardSummary || e.goForwardSummary || "", name),
  };
  zh[slug] = next;
  fixed += 1;
}

const zhTW = {};
for (const [slug, z] of Object.entries(zh)) {
  zhTW[slug] = {
    name: toTw(z.name),
    description: toTw(z.description),
    businessModel: toTw(z.businessModel),
    industry: toTw(z.industry),
    sector: toTw(z.sector),
    fundingRoundNote: toTw(z.fundingRoundNote),
    goForwardSummary: toTw(z.goForwardSummary),
  };
}

writeFileSync("lib/i18n/idea-packs/zh-CN.json", JSON.stringify(zh, null, 2) + "\n");
writeFileSync("lib/i18n/idea-packs/zh-TW.json", JSON.stringify(zhTW, null, 2) + "\n");

let stillBad = 0;
for (const [slug, f] of Object.entries(zh)) {
  if (hasHeavyEnglish(f.description) || (f.sector && /^[A-Za-z]/.test(f.sector) && !/[\u4e00-\u9fff\/]/.test(f.sector))) {
    stillBad += 1;
    console.log("still", slug, f.sector, f.description.slice(0, 60));
  }
}
console.log(JSON.stringify({ fixed, stillBad, sample: zh["bytedance-creator-os"] }, null, 2));
