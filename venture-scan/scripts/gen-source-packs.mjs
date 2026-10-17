import { writeFileSync, mkdirSync, readFileSync } from "fs";

// Parse DATA_SOURCES from TS source without full TS compile.
const src = readFileSync(new URL("../lib/data-sources.ts", import.meta.url), "utf8");
const start = src.indexOf("export const DATA_SOURCES");
if (start < 0) throw new Error("DATA_SOURCES not found");
const eq = src.indexOf("=", start);
const arrStart = src.indexOf("[", eq);
let depth = 0;
let arrEnd = -1;
for (let i = arrStart; i < src.length; i++) {
  const ch = src[i];
  if (ch === "[") depth += 1;
  else if (ch === "]") {
    depth -= 1;
    if (depth === 0) {
      arrEnd = i;
      break;
    }
  }
}
if (arrEnd < 0) throw new Error("DATA_SOURCES array end not found");
const DATA_SOURCES = Function(`"use strict"; return (${src.slice(arrStart, arrEnd + 1)});`)();
const flagSrc = readFileSync(new URL("../lib/flag-codes.ts", import.meta.url), "utf8");
const flagMatch = flagSrc.match(/const COUNTRY_TO_ISO[^=]*=\s*(\{[\s\S]*?\});/);
const COUNTRY_TO_ISO = Function(`"use strict"; return (${flagMatch[1]});`)();
const ALL_COUNTRIES = [...new Set(DATA_SOURCES.flatMap((s) => s.countries))].sort((a, b) => a.localeCompare(b));


function withCountries(pack, locale, countries, countryToIso) {
  const map = {};
  for (const name of countries) {
    if (locale === "en") { map[name] = name; continue; }
    const iso = countryToIso[name];
    if (!iso) { map[name] = name; continue; }
    try {
      map[name] = new Intl.DisplayNames([locale], { type: "region" }).of(iso.toUpperCase()) || name;
    } catch {
      map[name] = name;
    }
  }
  return { ...pack, countries: map };
}

mkdirSync(new URL("../lib/i18n/source-packs", import.meta.url), { recursive: true });

const enRegions = Object.fromEntries(
  [...new Set(DATA_SOURCES.map((s) => s.region))].sort().map((r) => [r, r]),
);
const enSources = Object.fromEntries(
  DATA_SOURCES.map((s) => [
    s.id,
    s.notes ? { description: s.description, notes: s.notes } : { description: s.description },
  ]),
);

function write(locale, pack) {
  const path = new URL(`../lib/i18n/source-packs/${locale}.json`, import.meta.url);
  writeFileSync(path, JSON.stringify(pack, null, 2) + "\n");
  console.log(locale, Object.keys(pack.regions).length, Object.keys(pack.sources).length);
}

write("en", withCountries({ regions: enRegions, sources: enSources }, "en", ALL_COUNTRIES, COUNTRY_TO_ISO));

const zhCN = {
  regions: {
    Africa: "非洲",
    Asia: "亚洲",
    "Asia-Pacific": "亚太",
    Brazil: "巴西",
    DACH: "德语区（德奥瑞）",
    Europe: "欧洲",
    "Francophone Europe / Africa": "法语欧洲 / 非洲",
    Global: "全球",
    "Global / AI": "全球 / 人工智能",
    "Global / North America": "全球 / 北美",
    "Global South": "全球南方",
    "Greater China": "大中华区",
    India: "印度",
    Israel: "以色列",
    Korea: "韩国",
    "Latin America": "拉丁美洲",
    MENA: "中东与北非",
    Nordics: "北欧",
    Oceania: "大洋洲",
    "South Asia": "南亚",
    "Southern Cone": "南锥体",
    "Türkiye / Eastern Europe": "土耳其 / 东欧",
    Vietnam: "越南",
    "West Africa": "西非",
  },
  sources: {
    techcrunch: { description: "全球创业与融资新闻专线。" },
    "crunchbase-news": { description: "融资轮次公告与投资人动态。" },
    "36kr": { description: "中文创业与硬科技报道。" },
    krasia: { description: "东南亚与东亚创业情报。" },
    techinasia: { description: "亚太创业融资与产品报道。" },
    "nikkei-asia": { description: "日经亚太商业与创投报道。" },
    platum: { description: "韩国创业与融资专线。" },
    yourstory: { description: "聚焦印度的创业与融资故事。" },
    "startup-india": {
      description: "印度初创企业政府注册与认证信号。",
      notes: "每 48 小时批量同步",
    },
    sifted: { description: "欧洲创业与深科技融资报道。" },
    "eu-startups": { description: "泛欧创业新闻聚合。" },
    "les-echos-start": { description: "法语创业与成长期企业专线。" },
    gruenderszene: { description: "德语创始人与融资报道。" },
    africarena: { description: "非洲创投与生态报道。" },
    wamda: { description: "中东与北非创业与融资专线。" },
    contxto: { description: "拉美创业与风险资本报道。" },
    "startupbase-br": {
      description: "巴西创业地图、排名与生态情报。",
      notes: "注册库每 24 小时抓取",
    },
    "israel-tech": { description: "以色列深科技与网络安全融资信号。" },
    afrilabs: {
      description: "非洲创始人与投资人交易流社区。",
      notes: "社区摘要每 12 小时",
    },
    "pitchbook-public": { description: "公开融资简报与市场笔记。" },
    venturebeat: { description: "人工智能与企业级创业产品/融资报道。" },
    "rest-of-world": { description: "硅谷以外的科技故事。" },
    "startupdaily-au": { description: "澳大利亚与新西兰创业与资本市场专线。" },
    "nordic-startup-news": { description: "来自斯德哥尔摩的北欧创业、科技与成长期报道。" },
    webrazzi: { description: "土耳其语科技与创业融资专线。" },
    "vnexpress-startup": { description: "越南创业与数字经济报道。" },
    technode: { description: "中外双语科技与创投资讯。" },
    "pulse-ng": { description: "西非与南部非洲创业资本报道。" },
    inc42: { description: "印度创业融资与政策信号。" },
    startupchile: {
      description: "拉美加速器与生态项目资讯。",
      notes: "项目批次每 24 小时同步",
    },
    dealstreetasia: { description: "亚洲私募市场交易、融资与投资人动态。" },
  },
};
write("zh-CN", withCountries(zhCN, "zh-CN", ALL_COUNTRIES, COUNTRY_TO_ISO));

const zhTW = {
  regions: {
    Africa: "非洲",
    Asia: "亞洲",
    "Asia-Pacific": "亞太",
    Brazil: "巴西",
    DACH: "德語區（德奧瑞）",
    Europe: "歐洲",
    "Francophone Europe / Africa": "法語歐洲 / 非洲",
    Global: "全球",
    "Global / AI": "全球 / 人工智慧",
    "Global / North America": "全球 / 北美",
    "Global South": "全球南方",
    "Greater China": "大中華區",
    India: "印度",
    Israel: "以色列",
    Korea: "韓國",
    "Latin America": "拉丁美洲",
    MENA: "中東與北非",
    Nordics: "北歐",
    Oceania: "大洋洲",
    "South Asia": "南亞",
    "Southern Cone": "南錐體",
    "Türkiye / Eastern Europe": "土耳其 / 東歐",
    Vietnam: "越南",
    "West Africa": "西非",
  },
  sources: {
    techcrunch: { description: "全球創業與募資新聞專線。" },
    "crunchbase-news": { description: "募資輪次公告與投資人動態。" },
    "36kr": { description: "中文創業與硬科技報導。" },
    krasia: { description: "東南亞與東亞創業情報。" },
    techinasia: { description: "亞太創業募資與產品報導。" },
    "nikkei-asia": { description: "日經亞太商業與創投報導。" },
    platum: { description: "韓國創業與募資專線。" },
    yourstory: { description: "聚焦印度的創業與募資故事。" },
    "startup-india": {
      description: "印度新創企業政府註冊與認證信號。",
      notes: "每 48 小時批次同步",
    },
    sifted: { description: "歐洲創業與深科技募資報導。" },
    "eu-startups": { description: "泛歐創業新聞聚合。" },
    "les-echos-start": { description: "法語創業與成長型企業專線。" },
    gruenderszene: { description: "德語創辦人與募資報導。" },
    africarena: { description: "非洲創投與生態報導。" },
    wamda: { description: "中東與北非創業與募資專線。" },
    contxto: { description: "拉美創業與風險資本報導。" },
    "startupbase-br": {
      description: "巴西創業地圖、排名與生態情報。",
      notes: "註冊庫每 24 小時抓取",
    },
    "israel-tech": { description: "以色列深科技與網路安全募資信號。" },
    afrilabs: {
      description: "非洲創辦人與投資人交易流社群。",
      notes: "社群摘要每 12 小時",
    },
    "pitchbook-public": { description: "公開募資簡報與市場筆記。" },
    venturebeat: { description: "人工智慧與企業級創業產品／募資報導。" },
    "rest-of-world": { description: "矽谷以外的科技故事。" },
    "startupdaily-au": { description: "澳大利亞與紐西蘭創業與資本市場專線。" },
    "nordic-startup-news": { description: "來自斯德哥爾摩的北歐創業、科技與成長型報導。" },
    webrazzi: { description: "土耳其語科技與創業募資專線。" },
    "vnexpress-startup": { description: "越南創業與數位經濟報導。" },
    technode: { description: "中外雙語科技與創投資訊。" },
    "pulse-ng": { description: "西非與南部非洲創業資本報導。" },
    inc42: { description: "印度創業募資與政策信號。" },
    startupchile: {
      description: "拉美加速器與生態項目資訊。",
      notes: "項目批次每 24 小時同步",
    },
    dealstreetasia: { description: "亞洲私募市場交易、募資與投資人動態。" },
  },
};
write("zh-TW", withCountries(zhTW, "zh-TW", ALL_COUNTRIES, COUNTRY_TO_ISO));

// For other locales: start from Spanish-quality map then adapt; load from sibling JSON fragments.
const other = JSON.parse(readFileSync(new URL("./source-pack-locales.json", import.meta.url), "utf8"));
for (const [locale, pack] of Object.entries(other)) {
  // Ensure every en key exists
  for (const r of Object.keys(enRegions)) {
    if (!pack.regions[r]) throw new Error(`${locale} missing region ${r}`);
  }
  for (const id of Object.keys(enSources)) {
    if (!pack.sources[id]?.description) throw new Error(`${locale} missing source ${id}`);
  }
  write(locale, withCountries(pack, locale, ALL_COUNTRIES, COUNTRY_TO_ISO));
}
