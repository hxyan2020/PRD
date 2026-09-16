window.TRN_MEASURES_ZH = {
  "cfd-spoofing": [
    { text: "DMA：按品种与时段设置报撤比与撤单上限，并配备熔断。", severity: "high", trigger: "突破", owner: "风险", event: "重复幌骗或关联账户墙" },
    { text: "对超过名义门槛的可见量设置最短停留（如 400–1000 毫秒）。", severity: "standing", trigger: "常开", owner: "产品", event: "防止该类攻击" },
    { text: "自成交防护与关联账户聚合须在报撤比检测之前。", severity: "standing", trigger: "常开", owner: "系统", event: "防止该类攻击" },
    { text: "不要向也能打击这些 LP 的客户展示多 LP 聚合深度。", severity: "standing", trigger: "常开", owner: "产品", event: "防止该类攻击" },
    { text: "预警报撤比后收取报文费或限流。", severity: "elevated", trigger: "预警", owner: "系统", event: "单一账户报撤比预警，首次情节" },
    { text: "训练 LP 淡出从不成交的单侧墙。", severity: "elevated", trigger: "预警", owner: "执行", event: "可见墙，尚无成交" }
  ],
  "cfd-last-look": [
    { text: "零售及任何被宣传为可成交的报价，优先使用确定/无最后一瞥行情。", severity: "standing", trigger: "常开", owner: "产品", event: "防止该类攻击" },
    { text: "硬性限制持有时间（流式外汇如 25–40 毫秒），超时自动改路由备份 LP。", severity: "standing", trigger: "常开", owner: "系统", event: "防止该类攻击" },
    { text: "对称规则：因不利波动拒单，也必须以同样幅度因有利波动拒单。", severity: "standing", trigger: "常开", owner: "产品", event: "防止该类攻击" },
    { text: "在 LP 记分卡公布拒单率与持有时间 SLA，并自动改路由。", severity: "elevated", trigger: "预警", owner: "执行", event: "单一 LP 持有/拒单 SLA 失败" },
    { text: "把授信最后一瞥（罕见、须记录）与价格最后一瞥（不鼓励）分开。", severity: "standing", trigger: "常开", owner: "产品", event: "防止该类攻击" },
    { text: "B 簿：禁止用更快的主市场行情，在客户已击中更慢报价之后决定是否接受。", severity: "high", trigger: "突破", owner: "合规", event: "已证实的抢跑式接受/拒绝" }
  ],
  "cfd-stop-hunt": [
    { text: "不要发布精确到个人的强平地图；若发布则分桶并延迟。", severity: "standing", trigger: "常开", owner: "产品", event: "防止该类攻击" },
    { text: "随机化止损触发（限价止损、挂钩或微小时间抖动），使集群不是单一跳动。", severity: "standing", trigger: "常开", owner: "产品", event: "防止该类攻击" },
    { text: "在已知事件窗口限制杠杆；预先压平有毒集中。", severity: "elevated", trigger: "预警", owner: "风险", event: "止损成簇 + 事件窗口" },
    { text: "尽可能把止损出场做成限价或时间加权，而不是一次市价倾泻。", severity: "high", trigger: "突破", owner: "系统", event: "止损正在触发，冲击进行中" },
    { text: "信息隔离：自营簿不能实时看到客户止损分布。", severity: "standing", trigger: "常开", owner: "合规", event: "防止该类攻击" },
    { text: "保证止损产品应入库对冲，而不是公司彩票。", severity: "high", trigger: "突破", owner: "法务", event: "公司损益跟踪散户止损" }
  ],
  "cfd-mark-close": [
    { text: "使用稳健估值：多场所中位数、截尾时间加权或官方拍卖——不是最后一笔。", severity: "standing", trigger: "常开", owner: "产品", event: "防止该类攻击" },
    { text: "拉长资金费/结算窗口，若你控制公式则把起点随机数秒。", severity: "standing", trigger: "常开", owner: "产品", event: "防止该类攻击" },
    { text: "限制单一账户窗口份额（如 10–15%）。", severity: "elevated", trigger: "预警", owner: "风险", event: "单一家族主导窗口" },
    { text: "在已知收盘日对集中账本加收保证金。", severity: "elevated", trigger: "预警", owner: "风险", event: "集中账本进入官方打印" },
    { text: "公司账本用独立价格源；无合规复核不得由交易员改估值。", severity: "high", trigger: "突破", owner: "合规", event: "对公司有利的手工估值覆盖" },
    { text: "预先公布移仓方法；公布买卖价与量。", severity: "standing", trigger: "常开", owner: "产品", event: "防止该类攻击" }
  ],
  "cfd-wash-ib": [
    { text: "按净新增权益或合格手数支付 IB，而不是原始成交量。", severity: "standing", trigger: "常开", owner: "产品", event: "防止该类攻击" },
    { text: "自成交防护跑在受益所有人图谱上，而不是登录号。", severity: "standing", trigger: "常开", owner: "系统", event: "防止该类攻击" },
    { text: "赠金流水排除关联账户与不足 1 分钟的往返。", severity: "standing", trigger: "常开", owner: "反欺诈", event: "防止该类攻击" },
    { text: "STP：在打到 LP 前披露并拦截自成交。", severity: "elevated", trigger: "预警", owner: "系统", event: "首次自成交 / 循环手数" },
    { text: "每月 IB 取证：按手数/损益异常看前 20 名 IB。", severity: "elevated", trigger: "预警", owner: "合规", event: "IB 支出相对点差看起来不对" },
    { text: "对成簇账户做设备指纹与提现锁定。", severity: "high", trigger: "突破", owner: "反欺诈", event: "确认关联账户对倒" }
  ],
  "cfd-cross-underlying": [
    { text: "综合中间价：至少 3 个独立来源，中位数或截尾均值，单来源权重上限 40%。", severity: "standing", trigger: "常开", owner: "产品", event: "防止该类攻击" },
    { text: "在产品说明书中写明估值层级——禁止沉默的最后成交估值。", severity: "standing", trigger: "常开", owner: "产品", event: "防止该类攻击" },
    { text: "对来源日均量低的 CFD 提高保证金。", severity: "standing", trigger: "常开", owner: "风险", event: "防止该类攻击" },
    { text: "过时来源逻辑：场所不更新则踢出篮子。", severity: "elevated", trigger: "预警", owner: "系统", event: "单一来源沉默或偏离" },
    { text: "不要把尖峰的 100% 自动对冲到刚刚打印它的同一 LP。", severity: "high", trigger: "突破", owner: "风险", event: "对冲走在已打印尖峰上" },
    { text: "估值偏离综合价超过带宽时暂缓强平。", severity: "critical", trigger: "级联", owner: "系统", event: "客户正在被单一场所砸盘止损" }
  ],
  "cfd-funding-roll": [
    { text: "夹断资金费（如每 8 小时 ±0.75%），并用 15–60 分钟多场所溢价时间加权。", severity: "standing", trigger: "常开", owner: "产品", event: "防止该类攻击" },
    { text: "掉期来自独立 tom-next 再加已披露加价。", severity: "standing", trigger: "常开", owner: "产品", event: "防止该类攻击" },
    { text: "公布精确公式及其场所。", severity: "standing", trigger: "常开", owner: "产品", event: "防止该类攻击" },
    { text: "拍卖移仓，而不是最后一瞥式公司价。", severity: "standing", trigger: "常开", owner: "产品", event: "防止该类攻击" },
    { text: "窗口最后一小时按持仓百分比设仓位上限。", severity: "elevated", trigger: "预警", owner: "风险", event: "一簇停放进资金费" },
    { text: "对开仓不足 30 分钟且资金费后 30 分钟内平仓的库存收费。", severity: "high", trigger: "突破", owner: "风险", event: "重复收割，确认之后压平" }
  ],
  "cfd-liq-cascade": [
    { text: "按压力测试给保险基金定规模（见现有 stress_testing.py 模式）。", severity: "standing", trigger: "常开", owner: "首席风险官", event: "防止该类攻击" },
    { text: "动态杠杆：风险持仓上升时削减最大杠杆。", severity: "elevated", trigger: "预警", owner: "风险", event: "风险持仓越过预警带" },
    { text: "用限价 / 分批手数强平，而不是一笔市价。", severity: "high", trigger: "突破", owner: "系统", event: "第一波强平进行中" },
    { text: "在牌照允许处，先部分平仓与追保，再全额消灭。", severity: "high", trigger: "突破", owner: "风险", event: "维持保证金突破，账本仍可挽救" },
    { text: "综合价偏离时冻结估值并暂缓强平。", severity: "critical", trigger: "级联", owner: "系统", event: "估值相对综合价爆裂，级联开始" },
    { text: "保险之后才自动减仓；公布排名公式；无 VIP 豁免。", severity: "critical", trigger: "级联", owner: "法务", event: "保险耗尽，自动减仓即将触发" }
  ],
  "cfd-b-book-conflict": [
    { text: "用白话披露混合簿记；若走 B 簿不要宣传 DMA。", severity: "standing", trigger: "常开", owner: "法务", event: "防止该类攻击" },
    { text: "同一产品所有分层同一报价路径与持有上限，或公布付费档位。", severity: "standing", trigger: "常开", owner: "产品", event: "防止该类攻击" },
    { text: "对冲计时：若做 B 簿，须自担风险最短持有（如 1–5 秒），否则就是代理。", severity: "standing", trigger: "常开", owner: "产品", event: "防止该类攻击" },
    { text: "市价单正滑点对称。", severity: "standing", trigger: "常开", owner: "产品", event: "防止该类攻击" },
    { text: "独立操守管理信息：公司损益 vs 客户，由二道防线审阅——不是交易台。", severity: "elevated", trigger: "预警", owner: "合规", event: "公司/客户损益相关性上升" },
    { text: "禁止按客户选择的新闻窗口断线。", severity: "high", trigger: "突破", owner: "合规", event: "仅有毒/会赢客户在新闻时掉线" }
  ],
  "cfd-quote-stuff": [
    { text: "硬性报文预算与撤增费用。", severity: "standing", trigger: "常开", owner: "系统", event: "防止该类攻击" },
    { text: "可见报价最短存活。", severity: "standing", trigger: "常开", owner: "产品", event: "防止该类攻击" },
    { text: "每会话 CPU 隔离，使单一客户不能拖垮他人。", severity: "standing", trigger: "常开", owner: "技术", event: "防止该类攻击" },
    { text: "不要给零售 API 与托管 DMA 同样未限流的消防水带。", severity: "standing", trigger: "常开", owner: "产品", event: "防止该类攻击" },
    { text: "对失控撤单循环设置熔断。", severity: "high", trigger: "突破", owner: "系统", event: "同伴时延膨胀 + 撤单风暴" }
  ],
  "cex-wash": [
    { text: "按质量（真实紧点差 + 外部对冲 + 冲击）支付做市，而不是原始日均量。", severity: "standing", trigger: "常开", owner: "产品", event: "防止该类攻击" },
    { text: "自成交防护跑在存款地址图谱上。", severity: "standing", trigger: "常开", owner: "系统", event: "防止该类攻击" },
    { text: "监察公布：质量成交 vs 总成交。", severity: "elevated", trigger: "预警", owner: "市场质量", event: "对倒分进入预警带" },
    { text: "代币化资产：披露真实自由流通与关联成交。", severity: "standing", trigger: "常开", owner: "上币", event: "防止该类攻击" },
    { text: "取消经济倒置的返佣档（返佣 > 费用 + 点差）。", severity: "standing", trigger: "常开", owner: "产品", event: "防止该类攻击" },
    { text: "不要把你知道是关联方的“成交量”卖给聚合器。", severity: "high", trigger: "突破", owner: "上币", event: "确认关联盘口" }
  ],
  "cex-pump": [
    { text: "上币锁仓与分阶段解锁，钱包公开。", severity: "standing", trigger: "常开", owner: "上币", event: "防止该类攻击" },
    { text: "市场部门不得转发付费喊单群。", severity: "standing", trigger: "常开", owner: "市场", event: "防止该类攻击" },
    { text: "把内部人与做市钱包的链上监控写成上币契约。", severity: "elevated", trigger: "预警", owner: "监察", event: "已知催化剂前吸筹" },
    { text: "当社交 z 分数与收益走出拉盘形态时显示风险横幅。", severity: "elevated", trigger: "预警", owner: "系统", event: "社交 + 收益形态达预警" },
    { text: "冷静期：新上币降低杠杆，大额卖方延迟提现。", severity: "elevated", trigger: "预警", owner: "风险", event: "新上币或社交尖峰" },
    { text: "条款允许追回仍在场所上的对倒/拉盘所得。", severity: "high", trigger: "突破", owner: "法务", event: "确认内圈派发" }
  ],
  "cex-spoof": [
    { text: "报撤比与自成交做关联账户聚合。", severity: "standing", trigger: "常开", owner: "系统", event: "防止该类攻击" },
    { text: "超过名义的挂单设最短停留。", severity: "standing", trigger: "常开", owner: "产品", event: "防止该类攻击" },
    { text: "若同时上市现货 + 永续，跨产品监察是必须的。", severity: "standing", trigger: "常开", owner: "监察", event: "防止该类攻击" },
    { text: "不要展示同时有隐藏永续风险的账户的可幌骗“总深度”。", severity: "standing", trigger: "常开", owner: "产品", event: "防止该类攻击" },
    { text: "限制撤单风暴。", severity: "elevated", trigger: "预警", owner: "系统", event: "报撤比 / 撤单爆发达预警" }
  ],
  "cex-oracle-mark": [
    { text: "至少 5 个高质量场所的中位数；最大权重 25–30%；偏离立即排除。", severity: "standing", trigger: "常开", owner: "产品", event: "防止该类攻击" },
    { text: "时间加权/指数加权要长到闪电打印无法主导（资金费常 15–60 分钟；强平可更短但须综合价，不是单一盘口）。", severity: "standing", trigger: "常开", owner: "产品", event: "防止该类攻击" },
    { text: "永远不要把可闪电贷的现货当最新价读取。", severity: "standing", trigger: "常开", owner: "产品", event: "防止该类攻击" },
    { text: "代币化资产：净值来自一级/已鉴证净值，不是薄的中心化二级打印。", severity: "standing", trigger: "常开", owner: "产品", event: "防止该类攻击" },
    { text: "标记价速度熔断。", severity: "high", trigger: "突破", owner: "系统", event: "估值速度 / 成分 z 分数突破" },
    { text: "若强平打在后来被否定的估值上，保险 / 追回。", severity: "critical", trigger: "级联", owner: "风险", event: "客户在后来被丢弃的打印上被强平" }
  ],
  "cex-funding": [
    { text: "多场所溢价、30–60 分钟时间加权、每区间夹断。", severity: "standing", trigger: "常开", owner: "产品", event: "防止该类攻击" },
    { text: "不要让可对倒的现货场所主导溢价。", severity: "standing", trigger: "常开", owner: "产品", event: "防止该类攻击" },
    { text: "稳定币资金费对齐外部利率（类 SOFR 或借贷利率）再加基差，而不是最新价。", severity: "standing", trigger: "常开", owner: "产品", event: "防止该类攻击" },
    { text: "窗口内持仓份额上限。", severity: "elevated", trigger: "预警", owner: "风险", event: "一簇停放进资金费" },
    { text: "仅骑快照开平的惩罚费。", severity: "high", trigger: "突破", owner: "风险", event: "重复之后压平收割" }
  ],
  "cex-liq-adl": [
    { text: "停止发布精确到跳动的强平图。", severity: "standing", trigger: "常开", owner: "产品", event: "防止该类攻击" },
    { text: "按压力而不是营销给保险定规模。", severity: "standing", trigger: "常开", owner: "首席风险官", event: "防止该类攻击" },
    { text: "风险持仓上升时降低最大杠杆。", severity: "elevated", trigger: "预警", owner: "风险", event: "风险持仓越过预警带" },
    { text: "分批限价强平；逐仓 vs 全仓控制。", severity: "high", trigger: "突破", owner: "系统", event: "第一波强平进行中" },
    { text: "按比例或拍卖强平，而不是“谁最快谁吃”。", severity: "high", trigger: "突破", owner: "产品", event: "猎手坐在强迫流量上" },
    { text: "无自动减仓 VIP 豁免；公式上网站并写入日志。", severity: "critical", trigger: "级联", owner: "法务", event: "保险已空，自动减仓触发" }
  ],
  "cex-rwa": [
    { text: "要求持续储备证明，外加定期独立所有权确认（不只是余额）。", severity: "standing", trigger: "常开", owner: "托管", event: "防止该类攻击" },
    { text: "仅对照预注资隔离账户铸造赎回；每个铸造先与储备增量对账再上线。", severity: "standing", trigger: "常开", owner: "产品", event: "防止该类攻击" },
    { text: "禁止把关联成交用于“按净值交易”营销与抵押合格测试。", severity: "standing", trigger: "常开", owner: "上币", event: "防止该类攻击" },
    { text: "若你把它当现金等价物上市，你就拥有穿透义务。无法穿透，它就是风险资产。", severity: "standing", trigger: "常开", owner: "首席风险官", event: "防止该类攻击" },
    { text: "公开、机器可读的鉴证日历；错过日期自动降级代币。", severity: "elevated", trigger: "预警", owner: "系统", event: "过时或错过的鉴证" },
    { text: "把代币化现金、票据、黄金、基金与包装物当信用产品：削发、集中度上限、抵押熔断。", severity: "critical", trigger: "级联", owner: "风险", event: "储备缺口、设闸或脱锚——撤出抵押" }
  ],
  "cex-insider-unlock": [
    { text: "上币知必所需；水印 CRM；访问日志保留 5 年以上。", severity: "standing", trigger: "常开", owner: "合规", event: "防止该类攻击" },
    { text: "员工钱包披露与预批准；自首次商务接触起进限制名单。", severity: "standing", trigger: "常开", owner: "合规", event: "防止该类攻击" },
    { text: "合同锁仓配合场所可监控的链上归属。", severity: "standing", trigger: "常开", owner: "上币", event: "防止该类攻击" },
    { text: "代币化上线：与证券 IPO 隔离日志同一套内部人名单。", severity: "standing", trigger: "常开", owner: "法务", event: "防止该类攻击" },
    { text: "解锁：T-24 小时到 T+24 小时降杠杆、加保证金；流通供给横幅。", severity: "elevated", trigger: "预警", owner: "风险", event: "已知解锁窗口" },
    { text: "上币后团队钱包提现冷静期。", severity: "high", trigger: "突破", owner: "信任安全", event: "开盘时团队/内部人派发" }
  ],
  "cex-sandwich": [
    { text: "DEX 路由：私有订单流、MEV 保护中继或询价；永远不要对客户大单做天真的公开内存池清扫。", severity: "standing", trigger: "常开", owner: "执行", event: "防止该类攻击" },
    { text: "场外：带时间戳台账，客户完成前公司不得同名交易（或记录无风险自营）。", severity: "standing", trigger: "常开", owner: "合规", event: "防止该类攻击" },
    { text: "若公开热钱包扫描会泄露待处理充值，则延迟或随机化；使用许多充值地址。", severity: "standing", trigger: "常开", owner: "技术", event: "防止该类攻击" },
    { text: "API 行情平等；付费托管必须披露，且不得包含其他客户队列。", severity: "standing", trigger: "常开", owner: "产品", event: "防止该类攻击" },
    { text: "隔离墙：上币、场外与自营永续不得共享实时客户台账。", severity: "high", trigger: "突破", owner: "合规", event: "已证实内部抢跑或 VIP 特权" }
  ],
  "cex-depeg": [
    { text: "给每一种“现金等价”代币削发。零削发是选择，不是事实。", severity: "standing", trigger: "常开", owner: "风险", event: "防止该类攻击" },
    { text: "跨现货、理财与抵押的单一发行方集中度上限。", severity: "standing", trigger: "常开", owner: "风险", event: "防止该类攻击" },
    { text: "发行方剧本：透明赎回队列，禁止沉默设闸。", severity: "standing", trigger: "常开", owner: "发行方", event: "防止该类攻击" },
    { text: "预先起草脱锚客户文案——沉默会放大谣言。", severity: "elevated", trigger: "预警", owner: "合规", event: "锚定预警 / 谣言 + 流出" },
    { text: "估值来自可赎回一级 + 若干二级；丢掉被砸盘口。", severity: "high", trigger: "突破", owner: "系统", event: "一所被砸，其他仍可赎回" },
    { text: "在综合价可信之前，暂停以脱锚资产计价的强平。", severity: "critical", trigger: "级联", owner: "风险", event: "计价单位破裂，强平即将以其触发" }
  ]
};

window.TRN_SEVERITY_ZH = [
  { id: "standing", title: "常开", when: "始终生效", meaning: "产品与控制设计。在任何人被叫之前就活着。它们不等告警。", apply: "每一本账、每一时段。" },
  { id: "elevated", title: "中高", when: "预警", meaning: "第一信号：一个账户、一个窗口、尚未确认客户被消灭。限流、横幅、上限、改路由、加保证金。", apply: "L0–L1。保持盘口开放。先不要冻结市场。" },
  { id: "high", title: "高", when: "突破", meaning: "形态确认、关联账户，或客户损害已可成立。熔断行为方、分批强平、锁定提现、追回、改估值路径。", apply: "L2–L4。遏制行为方。能留下诚实流量就留下。" },
  { id: "critical", title: "极高", when: "级联", meaning: "错误估值、级联、储备缺失、脱锚或系统性客户消灭。先冻结正在造成伤害的引擎，再写档案。", apply: "立即 L0/L4。强平暂缓胜过一份整齐的 L3 备忘录。" }
];
