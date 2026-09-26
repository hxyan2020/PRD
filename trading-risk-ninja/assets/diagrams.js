window.TRN_DIAGRAMS = {
  "cfd-spoofing": {
    nodes: {
      IN: { at: [1, 0] },
      "01": { at: [1, 1] },
      "02": { at: [1, 2] },
      "03": { at: [1, 3] },
      "04": { at: [1, 4] },
      "05": { at: [1, 5] },
      "06": { at: [1, 6] },
      "07": { at: [1, 7] },
      OUT: { at: [1, 8] }
    },
    edges: [
      { from: "IN", to: "01" },
      { from: "01", to: "02" },
      { from: "02", to: "03" },
      { from: "03", to: "03", loop: true, en: "split / thicken wall", zh: "拆单 / 加厚假墙" },
      { from: "03", to: "04" },
      { from: "04", to: "05" },
      { from: "05", to: "06" },
      { from: "06", to: "07" },
      { from: "07", to: "03", loop: true, en: "next forced window", zh: "下一被迫窗口" },
      { from: "07", to: "OUT" }
    ]
  },
  "cfd-last-look": {
    nodes: {
      IN: { at: [1, 0] },
      "01": { at: [1, 1] },
      "02": { at: [1, 2] },
      "03": { at: [1, 3], shape: "decision" },
      "04": { at: [0, 5] },
      "05": { at: [2, 5] },
      OUT: { at: [1, 6] }
    },
    edges: [
      { from: "IN", to: "01" },
      { from: "01", to: "02" },
      { from: "02", to: "03" },
      { from: "03", to: "04", en: "favourable — accept", zh: "有利 — 接受" },
      { from: "03", to: "05", en: "adverse — reject", zh: "不利 — 拒绝" },
      { from: "04", to: "OUT", en: "hedged", zh: "对冲后离场" },
      { from: "05", to: "01", loop: true, en: "chase again", zh: "再追一口" },
      { from: "05", to: "OUT", en: "filtered out", zh: "被过滤离场" }
    ]
  },
  "cfd-stop-hunt": {
    nodes: {
      IN: { at: [1, 0] },
      "01": { at: [1, 1] },
      "02": { at: [1, 2] },
      "03": { at: [1, 3] },
      "04": { at: [0, 4] },
      "06": { at: [2, 4] },
      "05": { at: [1, 5] },
      OUT: { at: [1, 6] }
    },
    edges: [
      { from: "IN", to: "01" },
      { from: "01", to: "02" },
      { from: "02", to: "03" },
      { from: "03", to: "04", en: "stops / liqs fire", zh: "止损 / 强平触发" },
      { from: "03", to: "06", en: "B-book conflict", zh: "B 簿利益冲突" },
      { from: "04", to: "03", loop: true, en: "next cluster", zh: "下一簇" },
      { from: "04", to: "05" },
      { from: "06", to: "OUT" },
      { from: "05", to: "OUT" }
    ]
  },
  "cfd-mark-close": {
    nodes: {
      IN: { at: [1, 0] },
      "01": { at: [1, 1] },
      "02": { at: [1, 2] },
      "03": { at: [1, 3] },
      "04": { at: [1, 4] },
      "05": { at: [1, 5] },
      OUT: { at: [1, 6] }
    },
    edges: [
      { from: "IN", to: "01" },
      { from: "01", to: "02" },
      { from: "02", to: "03" },
      { from: "03", to: "04" },
      { from: "04", to: "05" },
      { from: "05", to: "02", loop: true, en: "next mark window", zh: "下一估值窗口" },
      { from: "05", to: "OUT" }
    ]
  },
  "cfd-wash-ib": {
    nodes: {
      IN: { at: [1, 0] },
      "01": { at: [1, 1] },
      "02": { at: [1, 2] },
      "03": { at: [0, 3] },
      "04": { at: [1, 3] },
      "05": { at: [2, 3] },
      OUT: { at: [1, 4] }
    },
    edges: [
      { from: "IN", to: "01" },
      { from: "01", to: "02" },
      { from: "02", to: "02", loop: true, en: "churn another clip", zh: "再空转一手" },
      { from: "02", to: "03", en: "IB rebate", zh: "IB 返佣" },
      { from: "02", to: "04", en: "bonus unlock", zh: "解锁彩金" },
      { from: "02", to: "05", en: "if STP", zh: "若走 STP" },
      { from: "03", to: "OUT" },
      { from: "04", to: "OUT" },
      { from: "05", to: "OUT" }
    ]
  },
  "cfd-cross-underlying": {
    nodes: {
      IN: { at: [1, 0] },
      "01": { at: [1, 1] },
      "02": { at: [1, 2] },
      "03": { at: [1, 3] },
      "04": { at: [1, 4], shape: "decision" },
      "05": { at: [1, 6] },
      OUT: { at: [1, 7] }
    },
    edges: [
      { from: "IN", to: "01" },
      { from: "01", to: "02" },
      { from: "02", to: "03" },
      { from: "03", to: "04" },
      { from: "04", to: "03", loop: true, en: "source still moving", zh: "源市场仍在动" },
      { from: "04", to: "05", en: "liq and / or hedge", zh: "强平和 / 或对冲" },
      { from: "05", to: "OUT" }
    ]
  },
  "cfd-funding-roll": {
    nodes: {
      IN: { at: [1, 0] },
      "01": { at: [1, 1] },
      "02": { at: [1, 2] },
      "03": { at: [1, 3] },
      "04": { at: [1, 4] },
      "05": { at: [1, 5] },
      OUT: { at: [1, 6] }
    },
    edges: [
      { from: "IN", to: "01" },
      { from: "01", to: "02" },
      { from: "02", to: "03" },
      { from: "03", to: "04" },
      { from: "04", to: "05" },
      { from: "05", to: "02", loop: true, en: "next funding / roll", zh: "下一资金费 / 移仓" },
      { from: "05", to: "OUT" }
    ]
  },
  "cfd-liq-cascade": {
    nodes: {
      IN: { at: [1, 0] },
      "01": { at: [1, 1] },
      "02": { at: [1, 2] },
      "03": { at: [1, 3] },
      "04": { at: [0, 5] },
      "05": { at: [2, 5] },
      OUT: { at: [1, 6] }
    },
    edges: [
      { from: "IN", to: "01" },
      { from: "01", to: "02" },
      { from: "02", to: "03" },
      { from: "03", to: "03", loop: true, en: "next liq cluster", zh: "下一强平簇" },
      { from: "03", to: "04", en: "book will not close", zh: "账本无法平掉" },
      { from: "03", to: "05", en: "bounce / rescue quotes", zh: "反弹 / 救援报价" },
      { from: "04", to: "OUT" },
      { from: "05", to: "OUT" }
    ]
  },
  "cfd-b-book-conflict": {
    nodes: {
      IN: { at: [1, 0] },
      "01": { at: [1, 1], shape: "decision" },
      "02": { at: [0, 3] },
      "04": { at: [2, 3] },
      "03": { at: [0, 4] },
      "05": { at: [1, 5] },
      OUT: { at: [1, 6] }
    },
    edges: [
      { from: "IN", to: "01" },
      { from: "01", to: "02", en: "easy flow → B-book", zh: "易吃流量 → B 簿" },
      { from: "01", to: "04", en: "toxic → friction / A-book", zh: "有毒 → 摩擦 / A 簿" },
      { from: "02", to: "03", en: "client suddenly right", zh: "客户突然做对" },
      { from: "02", to: "05", en: "client stays wrong", zh: "客户继续做错" },
      { from: "03", to: "05" },
      { from: "04", to: "05" },
      { from: "05", to: "OUT" }
    ]
  },
  "cfd-quote-stuff": {
    nodes: {
      IN: { at: [1, 0] },
      "01": { at: [1, 1] },
      "02": { at: [1, 2] },
      "03": { at: [1, 3] },
      "04": { at: [1, 4] },
      OUT: { at: [1, 5] }
    },
    edges: [
      { from: "IN", to: "01" },
      { from: "01", to: "02" },
      { from: "02", to: "02", loop: true, en: "keep bursting", zh: "继续刷单" },
      { from: "02", to: "03" },
      { from: "03", to: "04" },
      { from: "04", to: "OUT" }
    ]
  },
  "cex-wash": {
    nodes: {
      IN: { at: [1, 0] },
      "01": { at: [1, 1] },
      "02": { at: [1, 2] },
      "03": { at: [1, 3] },
      "04": { at: [0, 5] },
      "05": { at: [2, 5] },
      OUT: { at: [1, 6] }
    },
    edges: [
      { from: "IN", to: "01" },
      { from: "01", to: "02" },
      { from: "02", to: "03" },
      { from: "03", to: "03", loop: true, en: "24/7 paint", zh: "7×24 刷量" },
      { from: "03", to: "04", en: "retail sees depth", zh: "散户看见深度" },
      { from: "03", to: "05", en: "RWA / NAV variant", zh: "代币化 / 净值变体" },
      { from: "04", to: "OUT" },
      { from: "05", to: "OUT" }
    ]
  },
  "cex-pump": {
    nodes: {
      IN: { at: [1, 0] },
      "01": { at: [1, 1] },
      "02": { at: [1, 2] },
      "03": { at: [1, 3] },
      "04": { at: [1, 4] },
      "05": { at: [1, 5] },
      OUT: { at: [1, 6] }
    },
    edges: [
      { from: "IN", to: "01" },
      { from: "01", to: "02" },
      { from: "02", to: "03" },
      { from: "03", to: "04" },
      { from: "04", to: "05" },
      { from: "05", to: "02", loop: true, en: "rebrand next ticker", zh: "换标再拉下一只" },
      { from: "05", to: "OUT" }
    ]
  },
  "cex-spoof": {
    nodes: {
      IN: { at: [1, 0] },
      "01": { at: [1, 1] },
      "02": { at: [0, 2] },
      "03": { at: [2, 2] },
      "04": { at: [1, 3] },
      OUT: { at: [1, 4] }
    },
    edges: [
      { from: "IN", to: "01" },
      { from: "01", to: "02", en: "layer CEX book", zh: "在 CEX 分层" },
      { from: "01", to: "03", en: "market leans in", zh: "市场跟风" },
      { from: "02", to: "03" },
      { from: "02", to: "04" },
      { from: "03", to: "04" },
      { from: "04", to: "02", loop: true, en: "re-layer", zh: "再挂假墙" },
      { from: "04", to: "OUT" }
    ]
  },
  "cex-oracle-mark": {
    nodes: {
      IN: { at: [1, 0] },
      "01": { at: [1, 1] },
      "02": { at: [1, 2] },
      "03": { at: [1, 3] },
      "04": { at: [1, 4], shape: "decision" },
      "05": { at: [1, 6] },
      OUT: { at: [1, 7] }
    },
    edges: [
      { from: "IN", to: "01" },
      { from: "01", to: "02" },
      { from: "02", to: "03" },
      { from: "03", to: "04" },
      { from: "04", to: "03", loop: true, en: "print still live", zh: "假价仍在" },
      { from: "04", to: "05", en: "liq · funding · NAV", zh: "强平 · 资金费 · 净值" },
      { from: "05", to: "OUT" }
    ]
  },
  "cex-funding": {
    nodes: {
      IN: { at: [1, 0] },
      "01": { at: [1, 1] },
      "02": { at: [1, 2] },
      "03": { at: [1, 3] },
      "04": { at: [1, 4] },
      "05": { at: [1, 5] },
      OUT: { at: [1, 6] }
    },
    edges: [
      { from: "IN", to: "01" },
      { from: "01", to: "02" },
      { from: "02", to: "03" },
      { from: "03", to: "04" },
      { from: "04", to: "05" },
      { from: "05", to: "02", loop: true, en: "next funding hour", zh: "下一资金费整点" },
      { from: "05", to: "OUT" }
    ]
  },
  "cex-liq-adl": {
    nodes: {
      IN: { at: [1, 0] },
      "01": { at: [1, 1] },
      "02": { at: [1, 2] },
      "03": { at: [1, 3] },
      "04": { at: [1, 4], shape: "decision" },
      "05": { at: [2, 5] },
      OUT: { at: [1, 6] }
    },
    edges: [
      { from: "IN", to: "01" },
      { from: "01", to: "02" },
      { from: "02", to: "03" },
      { from: "03", to: "02", loop: true, en: "next liq pocket", zh: "下一强平口袋" },
      { from: "03", to: "04" },
      { from: "04", to: "OUT", en: "hole closed", zh: "窟窿补上" },
      { from: "04", to: "05", en: "insurance / ADL / VIP skip", zh: "保险 / ADL / VIP 豁免" },
      { from: "05", to: "OUT" }
    ]
  },
  "cex-rwa": {
    nodes: {
      IN: { at: [1, 0] },
      "01": { at: [1, 1] },
      "02": { at: [1, 2] },
      "03": { at: [0, 3] },
      "04": { at: [2, 3] },
      "05": { at: [1, 4] },
      OUT: { at: [1, 5] }
    },
    edges: [
      { from: "IN", to: "01" },
      { from: "01", to: "02" },
      { from: "02", to: "03", en: "paint the peg", zh: "刷出净值锚" },
      { from: "02", to: "04", en: "stress / gate", zh: "压力 / 赎回闸" },
      { from: "03", to: "03", loop: true, en: "keep washing", zh: "继续对倒" },
      { from: "03", to: "04" },
      { from: "04", to: "05" },
      { from: "05", to: "OUT" }
    ]
  },
  "cex-insider-unlock": {
    nodes: {
      IN: { at: [1, 0] },
      "01": { at: [1, 1] },
      "02": { at: [1, 2] },
      "03": { at: [1, 3], shape: "decision" },
      "04": { at: [0, 5] },
      "05": { at: [2, 5] },
      OUT: { at: [1, 6] }
    },
    edges: [
      { from: "IN", to: "01" },
      { from: "01", to: "02" },
      { from: "02", to: "03" },
      { from: "03", to: "04", en: "sell the listing", zh: "上市砸盘" },
      { from: "03", to: "05", en: "unlock cliff", zh: "解锁悬崖" },
      { from: "04", to: "OUT" },
      { from: "05", to: "OUT" }
    ]
  },
  "cex-sandwich": {
    nodes: {
      IN: { at: [1, 0] },
      "01": { at: [1, 1], shape: "decision" },
      "02": { at: [0, 2] },
      "05": { at: [2, 2] },
      "03": { at: [1, 3] },
      "04": { at: [1, 4] },
      OUT: { at: [1, 5] }
    },
    edges: [
      { from: "IN", to: "01" },
      { from: "01", to: "02", en: "public mempool / deposit", zh: "公开内存池 / 充值" },
      { from: "01", to: "05", en: "privileged queue", zh: "特权队列" },
      { from: "05", to: "02", en: "internal look-ahead", zh: "内部抢先" },
      { from: "02", to: "03" },
      { from: "03", to: "04" },
      { from: "04", to: "01", loop: true, en: "next victim", zh: "下一受害者" },
      { from: "04", to: "OUT" }
    ]
  },
  "cex-depeg": {
    nodes: {
      IN: { at: [1, 0] },
      "01": { at: [1, 1] },
      "02": { at: [1, 2] },
      "03": { at: [1, 3], shape: "decision" },
      "04": { at: [1, 4] },
      "05": { at: [1, 5] },
      OUT: { at: [1, 6] }
    },
    edges: [
      { from: "IN", to: "01" },
      { from: "01", to: "02" },
      { from: "02", to: "03" },
      { from: "03", to: "04", en: "smash · rumour · gate", zh: "砸盘 · 谣言 · 闸门" },
      { from: "04", to: "04", loop: true, en: "next book / oracle", zh: "下一账本 / 预言机" },
      { from: "04", to: "05" },
      { from: "05", to: "OUT" }
    ]
  }
};
