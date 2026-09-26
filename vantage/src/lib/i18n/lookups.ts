import type { Locale } from "./locale";

const PLACES: Record<string, string> = {
  "United States": "美国",
  "United Kingdom": "英国",
  "European Union": "欧盟",
  Global: "全球",
  China: "中国",
  Japan: "日本",
  "Hong Kong": "香港",
  Singapore: "新加坡",
  France: "法国",
  Germany: "德国",
  Spain: "西班牙",
  Canada: "加拿大",
  Switzerland: "瑞士",
  Italy: "意大利",
  Netherlands: "荷兰",
  Australia: "澳大利亚",
  India: "印度",
  Russia: "俄罗斯",
  "South Korea": "韩国",
  "South Africa": "南非",
  Israel: "以色列",
  Cyprus: "塞浦路斯",
  Denmark: "丹麦",
  Sweden: "瑞典",
  Poland: "波兰",
  Austria: "奥地利",
  Thailand: "泰国",
  Mexico: "墨西哥",
  Philippines: "菲律宾",
  Lithuania: "立陶宛",
  Estonia: "爱沙尼亚",
  Luxembourg: "卢森堡",
  Malta: "马耳他",
  Bermuda: "百慕大",
  "Cayman Islands": "开曼群岛",
  Seychelles: "塞舌尔",
  Panama: "巴拿马",
  "British Virgin Islands": "英属维尔京群岛",
  Gibraltar: "直布罗陀",
  "Saint Vincent and the Grenadines": "圣文森特和格林纳丁斯",
  "United Arab Emirates": "阿联酋",
  "n/a": "不适用",
  Beijing: "北京",
  Shanghai: "上海",
  Shenzhen: "深圳",
  Fuzhou: "福州",
  "New York": "纽约",
  London: "伦敦",
  Paris: "巴黎",
  Tokyo: "东京",
  Madrid: "马德里",
  "San Francisco": "旧金山",
  Charlotte: "夏洛特",
  Montrouge: "蒙鲁日",
  Frankfurt: "法兰克福",
  Zurich: "苏黎世",
  Toronto: "多伦多",
  Montreal: "蒙特利尔",
  Amsterdam: "阿姆斯特丹",
  Turin: "都灵",
  Milan: "米兰",
  Bilbao: "毕尔巴鄂",
  Edinburgh: "爱丁堡",
  Sydney: "悉尼",
  Mumbai: "孟买",
  Moscow: "莫斯科",
  Melbourne: "墨尔本",
  Boston: "波士顿",
  Westlake: "西湖城",
  Malvern: "马尔文",
  Greenwich: "格林尼治",
  "St. Louis": "圣路易斯",
  "St. Petersburg": "圣彼得堡",
  "Menlo Park": "门洛帕克",
  Bristol: "布里斯托",
  Manchester: "曼彻斯特",
  Copenhagen: "哥本哈根",
  Berlin: "柏林",
  Gland: "格兰",
  Stockholm: "斯德哥尔摩",
  Haifa: "海法",
  Limassol: "利马索尔",
  Warsaw: "华沙",
  Plantation: "普兰泰申",
  Chicago: "芝加哥",
  Bengaluru: "班加罗尔",
  Bangkok: "曼谷",
  "Mexico City": "墨西哥城",
  Seoul: "首尔",
  Vienna: "维也纳",
  Alicante: "阿利坎特",
  Vilnius: "维尔纽斯",
  Hamilton: "汉密尔顿",
  Tallinn: "塔林",
  Johannesburg: "约翰内斯堡",
  Manila: "马尼拉",
};

const ASSETS: Record<string, string> = {
  BTC: "比特币",
  ETH: "以太坊",
  stablecoins: "稳定币",
  "tokenized assets / RWAs": "代币化资产 / RWA",
  ETFs: "ETF",
  "crypto perpetuals": "加密永续合约",
  options: "期权",
  futures: "期货",
  swaps: "互换",
  "mortgages / MBS": "按揭 / MBS",
  "government bonds": "国债",
  equities: "股票",
  FX: "外汇",
  commodities: "大宗商品",
};

export function placeLabel(value: string, locale: Locale): string {
  if (locale !== "zh") return value;
  return PLACES[value] ?? value;
}

export function assetLabel(value: string, locale: Locale): string {
  if (locale !== "zh") return value;
  return ASSETS[value] ?? value;
}

export function impactSummary(
  locale: Locale,
  sectors: string[],
  assets: string[],
  sectorText: string,
): string {
  if (locale === "zh") {
    const assetBit = assets.length
      ? ` 关注资产：${assets.map((asset) => assetLabel(asset, "zh")).join("、")}。`
      : "";
    return `对${sectorText}的潜在影响。${assetBit}`;
  }
  const assetBit = assets.length ? ` Focus assets: ${assets.join(", ")}.` : "";
  return `Potential impact on ${sectorText}.${assetBit}`;
}
