/** Chinese copy for seeded LP list fields (best-for / strengths / weaknesses / regions). */
export type LpZhCopy = {
  bestFor: string[];
  strengths: string[];
  weaknesses: string[];
  regions: string[];
};

export const LP_ZH: Record<string, LpZhCopy> = {
  finalto: {
    regions: ["英国", "欧盟", "新加坡", "阿联酋", "澳大利亚", "BVI"],
    bestFor: ["XAUUSD", "主要货币对", "美/欧指数", "经纪商风控 + 流动性栈"],
    strengths: [
      "深度多资产 PoP，集成风控（ClearVision 血统）",
      "LD4 / NY4 / SG3 机房共置",
      "面向 CFD 经纪商的贵金属与指数簿深度强",
    ],
    weaknesses: [
      "商务条款偏关系驱动，非即插即用的廉价加密场所",
      "加密覆盖相对纯加密交易所更选择性",
    ],
  },
  "cmc-markets": {
    regions: ["英国", "新加坡", "澳大利亚", "加拿大", "欧盟"],
    bestFor: ["指数", "股票 CFD", "商品", "多资产单账户"],
    strengths: [
      "自营 + 聚合的超深多资产簿（零售栈 2.1 万+ 品种）",
      "机构 API / FIX，对接 LD4",
      "指数、股票 CFD 与商品深度强",
    ],
    weaknesses: [
      "有加密但非 Bybit/Binance 级 24/7 原生深度",
      "对小型经纪商机构商务成本可能偏高",
    ],
  },
  velocity: {
    regions: ["南非", "英国", "欧盟", "澳大利亚", "亚洲"],
    bestFor: ["外汇分散", "新兴市场外汇", "贵金属备源流"],
    strengths: [
      "机构多资产执行场所，见于欧盟 RTS28 场所列表",
      "作为 Finalto / IS Prime 之外的有用分散 LP",
      "新兴市场外汇与贵金属能力",
    ],
    weaknesses: [
      "在许多经纪商成交份额小于 Finalto/IS Prime",
      "相对加密原生场所，交钥匙加密能力较弱",
    ],
  },
  cfh: {
    regions: ["英国", "欧盟", "新加坡"],
    bestFor: ["历史 CFH 关系延续", "外汇/贵金属连续性核验"],
    strengths: [
      "机构 CFD 领域 STP / ClearVision 历史口碑",
      "以 CFH 品牌入驻的经纪商关系可延续",
    ],
    weaknesses: [
      "品牌大体已由 Finalto 承接 — 除非仍有在途 CFH 实体，否则按别名/遗留流处理",
      "未确认前勿与 Finalto 产能重复计算",
    ],
  },
  b2broker: {
    regions: ["欧盟", "塞舌尔", "纳闽", "南非", "全球"],
    bestFor: ["加密 CFD", "快速多资产扩张", "交钥匙桥接"],
    strengths: [
      "1,500+ 品种 / 交钥匙 LP + 技术栈",
      "同一 PoP 下加密 CFD + 外汇组合强",
      "友好支持 MT4/MT5/cTrader/FIX，入驻快",
    ],
    weaknesses: [
      "定价质量更偏聚合/零售经纪导向，弱于银行级 PoP",
      "多实体监管需谨慎选签约主体",
    ],
  },
  isprime: {
    regions: ["英国", "欧盟", "澳大利亚", "直布罗陀"],
    bestFor: ["XAUUSD 紧定价", "主要货币对低延迟", "活跃流指数 CFD"],
    strengths: [
      "FCA PoP，专长低延迟外汇 / 贵金属 / 指数",
      "可配置流动性池，适合对 HFT 敏感的流量",
      "欧盟执行披露中常居场所份额前列",
    ],
    weaknesses: [
      "品种菜单窄于 CMC/B2Broker（加密/股票广度有限）",
      "低延迟产品溢价，商务条款反映这一点",
    ],
  },
  broctagon: {
    regions: ["塞浦路斯", "亚洲", "全球"],
    bestFor: ["聚合打包流动性", "区域台的加密+外汇组合"],
    strengths: [
      "面向经纪商的 CFD/加密聚合打包",
      "品种营销覆盖广，偏亚洲分销",
    ],
    weaknesses: [
      "监管文件披露含做市/自营成分 — 非纯 STP",
      "上游含 Finalto/IS Prime — 可能是再分销层",
    ],
  },
  mahifx: {
    regions: ["英国", "全球（技术层）"],
    bestFor: ["外汇定价引擎", "风险叠加层", "提升内部 LP 簿质量"],
    strengths: [
      "外汇价格形成与风险分析（MFX Compass 血统）",
      "与主 LP 搭配时可提升合成定价质量",
    ],
    weaknesses: [
      "本身并非完整多资产资产负债表 LP",
      "价值在技术/风险层 — 品种覆盖取决于底层场所",
    ],
  },
  "vantage-uk": {
    regions: ["英国", "经英国实体约束的欧盟客户"],
    bestFor: ["英国簿内部化", "集团风险轧差", "GBP 交叉盘"],
    strengths: [
      "对齐英国客户簿的集团内部流动性 / 风险仓储",
      "利于英国产品集与集团风险轧差",
    ],
    weaknesses: [
      "非外部分散 PoP — 过度依赖有集中度风险",
      "产能与定价受内部风险偏好约束",
    ],
  },
  bybit: {
    regions: ["全球（非受限地区）", "迪拜 / 亚洲为主运营足迹"],
    bestFor: ["BTCUSD", "ETHUSD", "山寨币 CFD 对冲", "24/7 加密"],
    strengths: [
      "深度永续 / 现货加密流动性，全天候",
      "有竞争力的 maker-taker 费率；BTC/ETH 簿强",
      "面向经纪商的机构 API / OTC 通道",
    ],
    weaknesses: [
      "不作为传统外汇/贵金属/指数主 LP",
      "司法辖区准入与银行通道因地区而异",
    ],
  },
  binance: {
    regions: ["全球（视实体而定）", "亚洲流动性强"],
    bestFor: ["广覆盖加密 CFD", "BNB 生态", "山寨币对冲"],
    strengths: [
      "众多交易对上全球最深的加密订单簿之一",
      "作为 CFD 标的的山寨币覆盖最广",
      "规模化后费率低",
    ],
    weaknesses: [
      "监管复杂度 / 实体选择运营负担重",
      "传统资产不在范围内",
    ],
  },
  okx: {
    regions: ["全球（视实体而定）", "亚洲 / 迪拜足迹"],
    bestFor: ["加密永续对冲", "期权信息定价", "亚洲加密时段"],
    strengths: [
      "衍生品流动性与期权栈强",
      "经纪商对冲用 API 性能有竞争力",
    ],
    weaknesses: [
      "部分山寨币零售心智份额略逊 Binance",
      "不承担传统多资产 LP 角色",
    ],
  },
  kraken: {
    regions: ["偏美国友好通道", "欧盟", "全球"],
    bestFor: ["合规敏感的加密对冲", "BTC/ETH", "与美国相关交易台"],
    strengths: [
      "相对纯离岸场所，合规口碑更强",
      "BTC/ETH 簿稳健，适合风险敏感加密对冲",
    ],
    weaknesses: [
      "多数交易对上费率更高 / 山寨深度薄于 Binance/Bybit",
      "非传统 CFD 多资产 LP",
    ],
  },
  gateio: {
    regions: ["偏亚洲", "全球非受限地区"],
    bestFor: ["长尾加密 CFD", "亚洲山寨上市"],
    strengths: [
      "长尾山寨覆盖极广，适合小众 CFD 标的",
      "费率有竞争力",
    ],
    weaknesses: [
      "主要币种盘口质量通常落后 Binance/Bybit/OKX",
      "需充分运营/合规尽调",
    ],
  },
  bitget: {
    regions: ["全球", "侧重亚洲 / 新兴市场"],
    bestFor: ["加密永续分散", "新兴市场加密交易台"],
    strengths: [
      "加密衍生品流动性有竞争力",
      "跟单时代流量可带来有趣的库存动态",
    ],
    weaknesses: [
      "品牌/合规审视因地区而异",
      "主要币种深度通常仍逊于 Binance/Bybit",
    ],
  },
  lmax: {
    regions: ["英国", "欧盟", "全球机构"],
    bestFor: ["主要货币对", "机构外汇价格发现"],
    strengths: ["类交易所外汇微观结构", "偏透明的 MTF 式定价"],
    weaknesses: ["多资产 CFD 菜单较窄", "非加密原生"],
  },
  "advanced-markets": {
    regions: ["澳大利亚", "开曼", "全球"],
    bestFor: ["外汇/CFD PoP 备选", "贵金属"],
    strengths: ["对经纪商友好的 PoP", "扎实的外汇/贵金属/指数组合"],
    weaknesses: ["加密原生能力较弱", "欧盟披露声量弱于 Finalto"],
  },
  saxo: {
    regions: ["丹麦", "欧盟", "新加坡", "全球"],
    bestFor: ["高端多资产", "股票 CFD", "债券"],
    strengths: ["高端多资产机构质量", "股票/债券广度"],
    weaknesses: ["成本更高", "机构入驻更重"],
  },
  invast: {
    regions: ["澳大利亚", "日本", "全球"],
    bestFor: ["USDJPY", "JP225", "亚洲外汇时段"],
    strengths: ["友好亚洲/日本的外汇与指数流动性", "经纪商 PoP 经验"],
    weaknesses: ["全球品牌声量小于 Finalto/CMC"],
  },
  onezero: {
    regions: ["全球"],
    bestFor: ["聚合 Finalto+CMC+加密场所", "智能路由 SOR"],
    strengths: ["多 LP 聚合枢纽", "智能订单路由"],
    weaknesses: ["非资产负债表 LP", "依赖所连接场所"],
  },
};
