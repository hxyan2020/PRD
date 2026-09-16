window.TRN_ZH = {
  meta: { playbooks: 20, venues: 2, products: 6, levels: 6 },
  cfd: [
    {
      id: "cfd-spoofing", code: "TRN-CFD-01", name: "幌骗与分层挂单",
      severity: "critical", products: ["spot", "margin", "perps", "futures"],
      summary: "交易者挂出无意成交的大单，倾斜可见盘口诱使他人追逐，再吃掉对侧真实流动性并撤销假墙。",
      why: "DMA/STP 的 CFD 与期货盘口仍展示深度。散户与中层算法把深度当成真实意愿。纯 B 簿平台上，客户若有底层行情或多 LP 聚合器，同一模式仍会出现。",
      workflow: [
        { n: "01", who: "掠食者", action: "挑选可见深度薄、或散户密集的时段（伦敦开盘指数 CFD、小币种外汇、小金属）。", tell: "最优档均量小于惯常手数；止损密度就在整数关口外侧。" },
        { n: "02", who: "掠食者", action: "先建立或规划真实方向的小仓（例如真正想买）。", tell: "先出现少量主动或中间价成交；库存尚未放大。" },
        { n: "03", who: "算法 / 交易台", action: "在最优价外 2–6 个跳动分层挂出超大买（或卖），有时拆到子账户或多 LP。", tell: "单侧可见量跳升 3–10 倍；多笔新单共享数量、存活时间与撤单指纹。" },
        { n: "04", who: "市场", action: "他人跟风：中间价/微观价漂移，真实侧队列变短，止损与冰山调整。", tell: "微观价朝假墙移动；跟风者出现；对侧队列变薄。" },
        { n: "05", who: "掠食者", action: "吃进或抬走现已改善的对侧（真正的经济成交）。", tell: "假墙最显眼的数秒内出现主动成交。" },
        { n: "06", who: "算法", action: "在假墙被击中前撤改分层，常在真实成交后亚秒级完成。", tell: "成交后撤单聚集；报撤比飙升；分层几乎无成交。" },
        { n: "07", who: "交易台", action: "在新闻、现金收盘、移仓或资金费窗口重复，此时他人被迫交易。", tell: "同一账户家族在相同品种、相同窗口反复出现。" }
      ],
      participants: [
        { role: "DMA / STP 客户或自营台", incentive: "在不暴露真实需求的情况下改善真实侧成交。" },
        { role: "串通子账户或 IB 簿", incentive: "把墙拆开，避免单一账户触发报撤比上限。" },
        { role: "做市商 / LP（受害或跟风）", incentive: "把报价靠向假量，随后被轧。" },
        { role: "散户集群（不知情）", incentive: "追逐打印出来的墙，提供退出流动性。" },
        { role: "经纪商监察 / 风险官", incentive: "必须重建多 LP 盘口，而不是只看内部流水。" }
      ],
      detection: {
        tools: ["Nasdaq SMARTS 分层模块", "Eventus Validus 幌骗场景", "NICE Actimize 股票/外汇 MAR 包", "内部 L3 回放（OneTick / kdb+ / QuestDB）", "账户–设备–IB 图谱"],
        parameters: [
          { metric: "报撤比（OTR）", window: "滚动 5 分钟 / 全日", warn: "流动性好的外汇/指数 > 15:1；薄品种 > 8:1", breach: "> 30:1，或 > 50:1 且几乎无成交", notes: "若网关标记了真冰山，予以排除。" },
          { metric: "未成交单撤单率", window: "同侧、对侧成交前 2–30 秒", warn: "> 80%", breach: "> 95% 且撤单中位时延 < 800 毫秒", notes: "与对侧主动攻击配对。" },
          { metric: "分层相对惯常可见量", window: "每品种该档 20 日中位数", warn: "> 3 倍", breach: "同时 3 档以上 > 5 倍", notes: "按时段（亚洲 vs 纽约）标准化。" },
          { metric: "成交不对称", window: "每次情节", warn: "分层成交 < 挂出量 10%，真实侧成交 > 意图 70%", breach: "分层零成交 + 对侧扫单完成", notes: "典型幌骗签名。" },
          { metric: "多账户协同", window: "同一 2 秒桶", warn: "2 个以上关联账户同侧分层", breach: "3 个以上或共享设备/IP/受益人", notes: "IB 层级收益高。" }
        ]
      },
      escalation: [
        { lvl: "L0", when: "实时", who: "系统", action: "自动告警；快照 L3 盘口 ±5 秒；冻结撤单原因码。" },
        { lvl: "L1", when: "15–30 分钟", who: "监察分析师", action: "回放情节；打分报撤比、撤单时延、不对称；若属新闻真实撤单则标误报。" },
        { lvl: "L2", when: "当日", who: "高级监察", action: "关联账户、设备、IB；若来自交易台则调取语音/聊天。" },
        { lvl: "L3", when: "T+1", who: "合规 / 反洗钱官", action: "立案；考虑 MAR/CFTC 幌骗档案；保全原始 drop copy。" },
        { lvl: "L4", when: "重大 / 重复", who: "风险负责人 + 法务", action: "切断 DMA、缩小手数、通知 LP/交易所。" },
        { lvl: "L5", when: "恶劣 / 跨境", who: "法务", action: "向监管/场所报告（FCA、ASIC、MAS、CFTC、交易所）。" }
      ],
      countermeasures: ["DMA：按品种与时段设置报撤比与撤单上限，并配备熔断。", "对超过名义门槛的可见量设置最短停留（如 400–1000 毫秒）。", "自成交防护与关联账户聚合须在报撤比检测之前。", "不要向也能打击这些 LP 的客户展示多 LP 聚合深度。", "预警报撤比后收取报文费或限流。", "训练 LP 淡出从不成交的单侧墙。"]
    },
    {
      id: "cfd-last-look", code: "TRN-CFD-02", name: "最后一瞥与不对称拒单",
      severity: "critical", products: ["spot", "margin"],
      summary: "流动性提供者把客户订单按住一个最后一瞥窗口：对己有利则接受，市场已对其不利则拒绝。",
      why: "外汇/CFD 的核心冲突。最后一瞥可以是授信与过时报价控制。当持有时间过长且拒单率单边时，就变成滥用。零售 CFD 的改价与“偏离市价”拒单，不过是换了名字的最后一瞥。",
      workflow: [
        { n: "01", who: "客户", action: "击中经纪商或 LP 流上展示的买卖价。", tell: "订单时间戳相对报价 ID 已知。" },
        { n: "02", who: "LP / B 簿", action: "按住订单（最后一瞥），检查新鲜度、授信，并预判下一跳。", tell: "持有时间聚集在 20–150 毫秒，部分品种更长。" },
        { n: "03", who: "LP", action: "若对 LP 有利的事后损益（客户错了/报价过时）则接受；若不利则拒绝或更宽改价。", tell: "被接受成交显示客户负 markout；被拒绝显示客户正 markout。" },
        { n: "04", who: "LP", action: "可能在持有之后到更快的主市场对冲已接受流量。", tell: "主市场子单刚好打在接受之后。" },
        { n: "05", who: "客户", action: "收到拒单/改价，追逐更差价格；有毒快速客户被系统性过滤。", tell: "同一客户在新闻跳动上的拒单率远高于安静盘口。" }
      ],
      participants: [
        { role: "主流 / 批发 LP", incentive: "避免被更快客户轧穿；保住倾斜。" },
        { role: "CFD 经纪商（B 簿或混合）", incentive: "留下容易的流量，拒绝知情流量。" },
        { role: "时延敏感客户", incentive: "用比 LP 报价更快的主市场行情交易。" },
        { role: "零售客户", incentive: "以为价格是确定的；实际对己是一个期权。" },
        { role: "成交分析 / 风险官", incentive: "必须量持有、拒单对称与 markout——不只看成交率。" }
      ],
      detection: {
        tools: ["BestX / Tradefeedr / LiquidMetrix 成交分析", "带报价 ID 的内部报价到成交台账", "网关与行情之间的时钟同步（PTP）", "端口级拒单原因分类"],
        parameters: [
          { metric: "最后一瞥持有时间", window: "每 LP、每品种，p50/p95", warn: "流式外汇 p95 > 50 毫秒；CFD > 100 毫秒", breach: "p95 > 150 毫秒，或无授信标记却持有 > 400 毫秒", notes: "把真正的授信最后一瞥单独标记。" },
          { metric: "拒单率", window: "滚动 1 小时 / 日", warn: "流动 G10 > 8%；小币种 > 15%", breach: "流动品种 > 20% 或任一品种 > 35%", notes: "按波动体制条件化。" },
          { metric: "拒单不对称（LP 赢 vs 输）", window: "同一窗口，用 T+100 毫秒与 T+1 秒中间价", warn: "P(拒单|将输) 为 P(拒单|将赢) 的 2 倍", breach: "3 倍及以上且统计显著", notes: "这就是滥用统计量。" },
          { metric: "已接受流量的客户 markout", window: "T+100 毫秒、T+1 秒、T+10 秒", warn: "相对同业 LP 系统性负客户 markout", breach: "已接受 markout 远差于已拒绝，G10 超过 0.3 点", notes: "与无最后一瞥 LP 比较。" },
          { metric: "改价距离", window: "每次拒单", warn: "超出新中间价 0.5 点以上", breach: "改价总是对客户更差，从不更好", notes: "单向改价是红旗。" }
        ]
      },
      escalation: [
        { lvl: "L0", when: "持续", who: "系统", action: "按 LP 与交易台发布持有/拒单看板。" },
        { lvl: "L1", when: "每日", who: "执行分析师", action: "成交分析包；标记对称性失败的 LP。" },
        { lvl: "L2", when: "每周 / 事件", who: "执行负责人 + 风险官", action: "LP 质询包；索取原始最后一瞥日志。" },
        { lvl: "L3", when: "持续存在", who: "合规", action: "最佳执行档案；审查“确定”与指示性报价的披露。" },
        { lvl: "L4", when: "客户损害 / 营销不符", who: "法务 + 产品", action: "关闭最后一瞥，改用确定流动性，或重新签约客户。" },
        { lvl: "L5", when: "监管检查", who: "法务", action: "向监管提交持有时间与对称性证据。" }
      ],
      countermeasures: ["零售及任何被宣传为可成交的报价，优先使用确定/无最后一瞥行情。", "硬性限制持有时间（流式外汇如 25–40 毫秒），超时自动改路由备份 LP。", "对称规则：因不利波动拒单，也必须以同样幅度因有利波动拒单。", "在 LP 记分卡公布拒单率与持有时间 SLA，并自动改路由。", "把授信最后一瞥（罕见、须记录）与价格最后一瞥（不鼓励）分开。", "B 簿：禁止用更快的主市场行情，在客户已击中更慢报价之后决定是否接受。"]
    },
    {
      id: "cfd-stop-hunt", code: "TRN-CFD-03", name: "猎杀止损与动量点火",
      severity: "high", products: ["margin", "perps", "futures"],
      summary: "主动手数把价格推过已知止损或强平集群，触发强迫买卖，掠食者再反向兑现。",
      why: "杠杆 CFD、永续与期货的止损集中在整数、时段高低点与公开强平热图。零售平台常发布或泄露这些位置。",
      workflow: [
        { n: "01", who: "掠食者", action: "从平台热图、期权墙、前高与散户整数绘制止损/强平集群。", tell: "公开“强平热图”，或许多小账户共享同一水平。" },
        { n: "02", who: "掠食者", action: "建立在这些止损触发时可获利的仓位（如在多头止损集群上方做空）。", tell: "建仓隐蔽：中间价、冰山或场外。" },
        { n: "03", who: "掠食者", action: "点火：用可成交单朝集群扫盘，有时用多个账户。", tell: "成交量尖峰、击穿、短命缺口；几乎无新闻。" },
        { n: "04", who: "平台", action: "止损与强平触发，同向再加可成交流量。", tell: "止损单占比跳升；追保/强平引擎打印。" },
        { n: "05", who: "掠食者", action: "反向：在强迫流量中平仓；价格回吐冲击的大部分。", tell: "数分钟内回撤冲击的 50–70%。" },
        { n: "06", who: "经纪商（利益冲突）", action: "若为 B 簿，公司可能受益于客户止损；必须证明与自营簿的隔离墙。", tell: "公司损益恰好在散户止损集群触发时跳升。" }
      ],
      participants: [
        { role: "知情 / 掠食客户", incentive: "收割止损流动性。" },
        { role: "散户群体", incentive: "止损紧、杠杆高——他们是燃料。" },
        { role: "强平 / 止损引擎", incentive: "机械、可预测，有时顺序触发。" },
        { role: "B 簿经纪商（冲突）", incentive: "未对冲时客户亏损可成公司盈利。" },
        { role: "社交信号贩卖者", incentive: "发布热图使集群成为常识。" }
      ],
      detection: {
        tools: ["止损/强平水平库（匿名）", "SMARTS 动量点火场景", "公司 vs 客户损益归因", "盘口扫单检测", "新闻/经济日历拼接"],
        parameters: [
          { metric: "冲击后回撤", window: "30 秒–15 分钟", warn: "扫单 ≥ 1.5×ATR(1 分钟) 后回撤 ≥ 50%", breach: "无新闻标签却回撤 ≥ 70%", notes: "排除预定公布（非农、FOMC）。" },
          { metric: "止损/强平成交占比", window: "冲击期间", warn: "> 25%", breach: "> 40% 且发起人是一小撮账户", notes: "需要止损单标记。" },
          { metric: "扫单到集群的距离", window: "每事件", warn: "触及集群 ±0.5 跳后反转", breach: "略微越过集群后完全回撤", notes: "典型猎杀。" },
          { metric: "主动成交账户集中度", window: "事件", warn: "前 3 账户 > 主动名义 40%", breach: "> 60% 或关联账户图谱", notes: "拆单仍会在设备上相连。" },
          { metric: "B 簿公司损益 vs 客户止损", window: "日 / 事件", warn: "与散户止损名义相关 > 0.6", breach: "公司恰好在此前交易同一水平", notes: "冲突案件——升级法务。" }
        ]
      },
      escalation: [
        { lvl: "L0", when: "实时", who: "系统", action: "在已知集群附近对冲击+回撤告警。" },
        { lvl: "L1", when: "30 分钟", who: "监察", action: "新闻过滤；识别攻击账户。" },
        { lvl: "L2", when: "当日", who: "风险官 + 市场风险", action: "若平台热图公开，审查产品设计。" },
        { lvl: "L3", when: "疑似冲突", who: "合规", action: "B 簿信息隔离审查；个人账户交易检查。" },
        { lvl: "L4", when: "重复掠食者", who: "风险", action: "加宽仅止损簿、降低该品种最大杠杆、限制攻击者。" },
        { lvl: "L5", when: "公司抢跑客户止损", who: "法务 / 反洗钱官", action: "客户救济，通知监管。" }
      ],
      countermeasures: ["不要发布精确到个人的强平地图；若发布则分桶并延迟。", "随机化止损触发（限价止损、挂钩或微小时间抖动），使集群不是单一跳动。", "尽可能把止损出场做成限价或时间加权，而不是一次市价倾泻。", "在已知事件窗口限制杠杆；预先压平有毒集中。", "信息隔离：自营簿不能实时看到客户止损分布。", "保证止损产品应入库对冲，而不是公司彩票。"]
    },
    {
      id: "cfd-mark-close", code: "TRN-CFD-04", name: "收盘、结算与移仓操纵",
      severity: "critical", products: ["spot", "margin", "perps", "futures"],
      summary: "成交集中到现金收盘、期货结算、CFD 日终估值或移仓窗口，以推动保证金、损益、资金费或估值所用的参考价。",
      why: "CFD 继承别人的标记：现金指数收盘、期货结算、经纪商中间价或资金费时间加权。推动那一笔打印，就推动所有人的抵押品。",
      workflow: [
        { n: "01", who: "持仓人", action: "持有依赖已知窗口的大额 CFD/期货（现金收盘、伦敦 16:30、纽约 15:00、周五移仓、08:00 资金费）。", tell: "持仓/客户仓位相对该窗口预期量很大。" },
        { n: "02", who: "交易员", action: "把库存停放或建到窗口内；有时停在相关期货或一篮子现货。", tell: "仓位在最后 30–60 分钟跳升。" },
        { n: "03", who: "交易员", action: "把主动量集中到最后数秒 / 官方拍卖 / 时间加权窗口。", tell: "最后 60 秒参与度远高于全天；价格偏离此前时间加权。" },
        { n: "04", who: "经纪系统", action: "日终估值、变动保证金或资金费使用该打印。", tell: "客户权益大起大落，随后几乎无成交。" },
        { n: "05", who: "交易员", action: "估值后平仓；价格回归。", tell: "窗口后 15–60 分钟回撤；库存均值回归。" }
      ],
      participants: [
        { role: "持有到期期货的对冲基金 / 自营", incentive: "改善期权、基金或保证金的官方结算。" },
        { role: "客户偏向很大的 CFD 台", incentive: "内部估值可减少追保或隐藏损益。" },
        { role: "移仓经纪", incentive: "打印有利于公司买卖价的移仓价。" },
        { role: "指数 / 拍卖运营方", incentive: "必须做稳健收盘；盘薄时仍可被倾斜。" },
        { role: "基金会计 / 净值（后续代币化）", incentive: "下游使用同一打印。" }
      ],
      detection: {
        tools: ["收盘窗口参与度报告", "拍卖失衡分析", "估值后中间价回撤", "相关工具基差监测", "SMARTS 收盘操纵"],
        parameters: [
          { metric: "官方窗口参与度", window: "最后 5 分钟 / 拍卖 / 资金费时间加权", warn: "> 窗口量 15%", breach: "单一账户家族 > 25% 或公司+关联 > 40%", notes: "用受益所有人，不是登录号。" },
          { metric: "价格相对窗口前时间加权", window: "最后 60 秒 vs 前 30 分钟时间加权", warn: "> 0.8 × 1 分钟标准差", breach: "> 1.5 × 且之后回撤", notes: "拼接新闻日历。" },
          { metric: "估值后回撤", window: "T+15 分 / T+60 分", warn: "回撤窗口波动 ≥ 50%", breach: "回撤 ≥ 75% 且库存已被压平", notes: "强意图证据。" },
          { metric: "跨产品倾斜", window: "现货 vs 期货 vs CFD", warn: "现货打印动了、期货没动（或相反）且超出惯常基差", breach: "仅在估值窗口内基差爆发", notes: "典型收盘游戏。" },
          { metric: "公司估值裁量", window: "每日", warn: "无来源的手工覆盖 > 5 个基点", breach: "覆盖总是对公司有利", notes: "审计估值政策。" }
        ]
      },
      escalation: [
        { lvl: "L0", when: "每个窗口", who: "系统", action: "自动包：参与度、波动、回撤。" },
        { lvl: "L1", when: "+30 分钟", who: "监察", action: "过滤确有失衡新闻的拍卖。" },
        { lvl: "L2", when: "T+0 / T+1", who: "市场风险 + 产品", action: "若是公司估值，用独立来源四眼重估。" },
        { lvl: "L3", when: "客户影响", who: "合规", action: "立案；考虑收盘价操纵报告。" },
        { lvl: "L4", when: "重复", who: "风险", action: "限制官方窗口手数；强制算法；改资金费时间加权设计。" },
        { lvl: "L5", when: "上市期货官方结算", who: "法务", action: "通知上市场所 / 监管。" }
      ],
      countermeasures: ["使用稳健估值：多场所中位数、截尾时间加权或官方拍卖——不是最后一笔。", "拉长资金费/结算窗口，若你控制公式则把起点随机数秒。", "限制单一账户窗口份额（如 10–15%）。", "公司账本用独立价格源；无合规复核不得由交易员改估值。", "预先公布移仓方法；公布买卖价与量。", "在已知收盘日对集中账本加收保证金。"]
    },
    {
      id: "cfd-wash-ib", code: "TRN-CFD-05", name: "对倒、炒单与 IB 返佣闭环",
      severity: "high", products: ["spot", "margin", "perps", "futures"],
      summary: "关联账户互为对手或来回翻同一仓位，制造成交量以套取返现、IB 佣金、赠金档位或表面活跃。",
      why: "CFD 介绍经纪按手数付费。赠金与返现按名义付费。若 KYC 关联弱，这就是对倒量的机器。",
      workflow: [
        { n: "01", who: "组织者", action: "开多个可交易同一品种的账户（本人、马甲、公司、不同 IB）。", tell: "共享设备、IP 自治域、资金来源或受益人。" },
        { n: "02", who: "账户", action: "对开 CFD 或快速翻同一手数，使净风险≈0 但手数打印。", tell: "库存均值回归近零；换手高，成本前净损益极小。" },
        { n: "03", who: "IB / 联盟", action: "收取成交量佣金或 CPA 结算。", tell: "IB 支出与循环手数同步上升。" },
        { n: "04", who: "赠金猎手", action: "满足流水要求后提现。", tell: "赠金解锁后迅速出金；交易无方向论点。" },
        { n: "05", who: "若 STP", action: "对倒也可能打到 LP，污染其盘口。", tell: "LP 抱怨自成交或零冲击量。" }
      ],
      participants: [
        { role: "IB / 联盟", incentive: "按手数抽佣，不按客户损益。" },
        { role: "返佣客户", incentive: "若控制双边或很紧的 B 簿，回扣可大于点差成本。" },
        { role: "马甲账户", incentive: "为 KYC 拿小钱。" },
        { role: "经纪商财务", incentive: "看起来像健康成交，直到支出超过点差捕获。" },
        { role: "反洗钱", incentive: "成交量也可为非法资金分层。" }
      ],
      detection: {
        tools: ["关联方图谱（KYC + 设备 + 银行）", "手数对损益与手数对保证金比", "IB 支出 vs 客户亏损对账", "自成交 / 对手账户时序", "赠金台账拼接"],
        parameters: [
          { metric: "净库存 / 总手数", window: "时段 / 7 日", warn: "< 8%（几乎走平）", breach: "< 3% 且手数 > 100", notes: "典型对倒比。" },
          { metric: "同量反向往返时间", window: "每账户对", warn: "< 30 秒", breach: "反复 < 5 秒", notes: "包含同一簇的对手账户。" },
          { metric: "设备 / 资金重叠", window: "开户 + 90 日", warn: "2 个账户", breach: "3 个以上或 IB 自有流量", notes: "模糊匹配电话、Cookie、最终受益人。" },
          { metric: "IB 支出 / 点差捕获", window: "月", warn: "> 40%", breach: "> 70% 或 IB 簿相对公司净盈利", notes: "经济模型破裂。" },
          { metric: "赠金流水后提现", window: "自赠金发放", warn: "48 小时内完成流水", breach: "24 小时内完成并提现且风险走平", notes: "赠金滥用。" }
        ]
      },
      escalation: [
        { lvl: "L0", when: "每日", who: "系统", action: "按手数 vs 净风险聚类；IB 异常名单。" },
        { lvl: "L1", when: "24 小时", who: "反欺诈 + 监察", action: "确认关联；暂停被标记手数的 IB 支出。" },
        { lvl: "L2", when: "当周", who: "反洗钱 / 合规", action: "若怀疑法币循环则查资金来源。" },
        { lvl: "L3", when: "确认对倒", who: "合规", action: "作废赠金、追回 IB，若应报则申报。" },
        { lvl: "L4", when: "网络", who: "风险 + 法务", action: "关闭集群、封禁 IB、通知支付伙伴。" },
        { lvl: "L5", when: "洗钱形态", who: "反洗钱官", action: "可疑交易报告。" }
      ],
      countermeasures: ["按净新增权益或合格手数支付 IB，而不是原始成交量。", "自成交防护跑在受益所有人图谱上，而不是登录号。", "赠金流水排除关联账户与不足 1 分钟的往返。", "对成簇账户做设备指纹与提现锁定。", "STP：在打到 LP 前披露并拦截自成交。", "每月 IB 取证：按手数/损益异常看前 20 名 IB。"]
    },
    {
      id: "cfd-cross-underlying", code: "TRN-CFD-06", name: "跨标的与基差倾斜",
      severity: "high", products: ["spot", "margin", "perps", "futures"],
      summary: "掠食者推动更便宜或更薄的标的（现货、小期货、相关 ETF 或离岸打印），使 CFD 估值、保证金或自动对冲跟随。",
      why: "多数 CFD 价格是衍生的。若推导只靠单一期货、单一外汇中间价或最后成交，衍生盘口可从外部被劫持。",
      workflow: [
        { n: "01", who: "掠食者", action: "找到估值来源很薄的 CFD（小盘 CFD、单一期货指数、单交易所加密 CFD、单 LP 小币种外汇）。", tell: "估值来源数 = 1 或 2；来源日均量相对 CFD 持仓很小。" },
        { n: "02", who: "掠食者", action: "建立在来源跳动时受益的 CFD 或永续仓位。", tell: "CFD 库存相对来源成交量大。" },
        { n: "03", who: "掠食者", action: "用来源场所（或经纪商对冲所用 LP）主动手数冲击。", tell: "来源打印尖峰；CFD 中间价 1:1 跳。" },
        { n: "04", who: "经纪引擎", action: "按新中间价重定价、强平或自动对冲。", tell: "客户强平或公司对冲在尖峰上触发。" },
        { n: "05", who: "掠食者", action: "两边平仓；来源回归。", tell: "来源量几乎全是掠食者；CFD 客户吃下了估值。" }
      ],
      participants: [
        { role: "跨场所交易者", incentive: "推动来源便宜，推动衍生盘口昂贵。" },
        { role: "经纪自动对冲", incentive: "机械追逐来源——可以成为出口。" },
        { role: "保证金客户", incentive: "在并非真实共识的打印上被止损。" },
        { role: "指数代理 / LP", incentive: "可能就是那个薄来源。" }
      ],
      detection: {
        tools: ["估值来源清单（哪些场所喂哪些 CFD）", "相对综合价的基差与 z 分数", "领先滞后（来源跳动然后 CFD 强平）", "外部场所 drop copy（若可得）", "Kaiko/Refinitiv 综合价 vs 公司中间价"],
        parameters: [
          { metric: "估值来源集中度", window: "静态 + 每日", warn: "第一来源权重 > 70%", breach: "单一场所 / 仅最后成交", notes: "设计缺陷。" },
          { metric: "CFD 持仓 / 来源日均量", window: "20 日", warn: "> 0.5", breach: "> 1.5", notes: "估值可被倾斜。" },
          { metric: "相对综合价的基差 z 分数", window: "1 秒–1 分钟", warn: "|z| > 3", breach: "|z| > 5 且持续 > 3 秒", notes: "冻结估值，不要强平。" },
          { metric: "领先滞后：来源主动量 → 公司强平", window: "事件", warn: "单场所尖峰 1 秒内强平", breach: "来源与 CFD 同一账户家族", notes: "铁证。" },
          { metric: "自动对冲相对综合价的滑点", window: "每笔对冲", warn: "> 正常 1.5 倍", breach: "尖峰后对冲走在单一 LP 上", notes: "对冲正在被收割。" }
        ]
      },
      escalation: [
        { lvl: "L0", when: "逐笔", who: "系统", action: "相对综合价 |z| 熔断；暂缓强平。" },
        { lvl: "L1", when: "数分钟", who: "市场风险", action: "确认是来源中断还是操纵。" },
        { lvl: "L2", when: "同时段", who: "监察", action: "追查谁交易了来源、谁在 CFD 上受益。" },
        { lvl: "L3", when: "客户损害", who: "合规", action: "重估；若打印偏离市价则恢复权益。" },
        { lvl: "L4", when: "结构性", who: "产品", action: "改估值公式；增加场所；加宽。" },
        { lvl: "L5", when: "跨场所滥用", who: "法务", action: "通知来源场所。" }
      ],
      countermeasures: ["综合中间价：至少 3 个独立来源，中位数或截尾均值，单来源权重上限 40%。", "估值偏离综合价超过带宽时暂缓强平。", "不要把尖峰的 100% 自动对冲到刚刚打印它的同一 LP。", "过时来源逻辑：场所不更新则踢出篮子。", "对来源日均量低的 CFD 提高保证金。", "在产品说明书中写明估值层级——禁止沉默的最后成交估值。"]
    },
    {
      id: "cfd-funding-roll", code: "TRN-CFD-07", name: "资金费、掉期与移仓收割",
      severity: "high", products: ["margin", "perps", "futures"],
      summary: "把仓位停放到资金费、隔夜掉期或期货移仓窗口，抽取并不反映真实期限利率的支付。",
      why: "永续 CFD 按标记–现货基差付资金费。传统 CFD 付隔夜掉期。到期期货有移仓。三者都是可被倾斜的公式。",
      workflow: [
        { n: "01", who: "交易员", action: "观察公式（溢价指数、正负利息、tom-next、移仓买卖价）。", tell: "公式与窗口公开或可反推。" },
        { n: "02", who: "交易员", action: "窗口前建立大额单边，有时对冲到不付同一费率的工具。", tell: "持仓份额在最后 10–30 分钟跳升。" },
        { n: "03", who: "交易员", action: "轻推估值或基差，使支付翻转或放大（向薄溢价指数下小手数）。", tell: "基差仅在窗口内尖峰。" },
        { n: "04", who: "引擎", action: "向停放一侧支付资金费/掉期/移仓。", tell: "支付相对轻推成本很大。" },
        { n: "05", who: "交易员", action: "快照后立即压平。", tell: "资金费后数分钟库存崩塌。" }
      ],
      participants: [
        { role: "资金费农民", incentive: "收割公式支付，不是观点。" },
        { role: "经纪商资金部", incentive: "掉期表可能内嵌公司加价。" },
        { role: "对冲配对交易者", incentive: "多 CFD、空主期货——收割价差。" },
        { role: "散户持有人", incentive: "支付他们看不见被制造出来的费率。" }
      ],
      detection: {
        tools: ["资金费窗口持仓份额", "溢价指数 vs 多场所基差", "库存阶跃检测", "掉期表 vs 市场 tom-next", "移仓量 vs 持仓"],
        parameters: [
          { metric: "进入资金费的账户持仓份额", window: "T-30 分到快照", warn: "> 15%", breach: "> 25% 或关联簇 > 35%", notes: "按品种。" },
          { metric: "快照后压平速度", window: "T+15 分", warn: "> 窗口仓位的 50% 消失", breach: "> 80% 消失", notes: "意图是收割，不是持有。" },
          { metric: "溢价 vs 综合基差", window: "资金费时间加权", warn: "公司溢价相对 3 场所基差 |z| > 3", breach: "|z| > 5", notes: "公式被轻推。" },
          { metric: "掉期 vs 独立 tom-next", window: "每日", warn: "相对中间价年化加价 > 1.5%", breach: "加价 > 3% 或仅单向", notes: "操守/披露，不只是滥用。" },
          { metric: "移仓参与度", window: "官方移仓", warn: "> 20%", breach: "> 35% 且移仓打印偏离综合价", notes: "与收盘操纵相同。" }
        ]
      },
      escalation: [
        { lvl: "L0", when: "每次资金费", who: "系统", action: "大户名单 + 之后压平名单。" },
        { lvl: "L1", when: "+1 小时", who: "监察", action: "确认另一场所对冲（合法套利 vs 游戏）。" },
        { lvl: "L2", when: "重复 3 个以上窗口", who: "风险官", action: "限制窗口仓位；改公式。" },
        { lvl: "L3", when: "对客户多收费", who: "合规", action: "掉期披露与退款审查。" },
        { lvl: "L4", when: "结构性", who: "产品", action: "更长时间加权、上限、夹断或基于利率的资金费。" },
        { lvl: "L5", when: "谎称“银行间掉期”", who: "法务", action: "操守案件。" }
      ],
      countermeasures: ["夹断资金费（如每 8 小时 ±0.75%），并用 15–60 分钟多场所溢价时间加权。", "窗口最后一小时按持仓百分比设仓位上限。", "掉期来自独立 tom-next 再加已披露加价。", "对开仓不足 30 分钟且资金费后 30 分钟内平仓的库存收费。", "拍卖移仓，而不是最后一瞥式公司价。", "公布精确公式及其场所。"]
    },
    {
      id: "cfd-liq-cascade", code: "TRN-CFD-08", name: "连环强平与自动减仓压力",
      severity: "critical", products: ["margin", "perps", "futures"],
      summary: "交易者或一笔薄打印把第一本杠杆账打穿维持保证金，引擎朝空洞卖出，下一本倒下，可选自动减仓再打对面赢家。",
      why: "高杠杆 + 盯市 + 顺序强平是已知级联。永续上，保险基金与自动减仓增加第二受害者：盈利的另一边。",
      workflow: [
        { n: "01", who: "风险地图", action: "识别高杠杆、强平价成簇、保险基金薄的品种。", tell: "持仓相对深度很大；许多账户共享相近强平价。" },
        { n: "02", who: "攻击者或随机冲击", action: "把估值推过第一簇（见猎杀止损与跨标的）。", tell: "第一批强平触发。" },
        { n: "03", who: "强平引擎", action: "市价倾泻（或买入）；估值进一步移动；下一簇触发。", tell: "强平量滋生强平量；深度蒸发。" },
        { n: "04", who: "保险 / 自动减仓", action: "若账本无法关闭，则削减保险基金或自动减仓对面仓位。", tell: "自动减仓排名触发；赢家被削减。" },
        { n: "05", who: "机会主义者", action: "在极端价提供“救援”流动性，或预先埋伏反弹。", tell: "新买仅在强迫流量之后出现。" }
      ],
      participants: [
        { role: "高杠杆群体", incentive: "便宜的贝塔——他们是级联燃料。" },
        { role: "强平引擎（系统）", incentive: "尽快关闭风险，有时太快。" },
        { role: "保险基金 / 公司", incentive: "吸收残值；可能资金不足。" },
        { role: "自动减仓受害者", incentive: "方向对了仍被砍。" },
        { role: "拾荒做市商", incentive: "买入强迫倾泻。" }
      ],
      detection: {
        tools: ["强平阶梯热图（内部、延迟）", "保险基金跑道", "级联模拟器（压力测试风格）", "估值冻结逻辑", "自动减仓排名审计"],
        parameters: [
          { metric: "X 个基点内的风险持仓", window: "持续", warn: "50 个基点内 > 持仓 15%", breach: "30 个基点内 > 25%", notes: "预先加保证金。" },
          { metric: "强平滋生强平比", window: "事件", warn: "第二波 > 第一波 50%", breach: "3 波以上或引擎走出 N 跳", notes: "顺序市价单。" },
          { metric: "保险基金 / 一日强平残值", window: "每日", warn: "< 3 倍", breach: "< 1 倍", notes: "可能自动减仓。" },
          { metric: "级联中估值 vs 综合价", window: "事件", warn: "偏离 > 30 个基点", breach: "偏离 > 80 个基点——冻结", notes: "不要在错误估值上强平。" },
          { metric: "自动减仓公平性", window: "每次自动减仓", warn: "排名不能用杠杆×盈利解释", breach: "公司或 VIP 豁免", notes: "操守问题。" }
        ]
      },
      escalation: [
        { lvl: "L0", when: "始终", who: "系统", action: "实时风险持仓；预警时自动降低最大杠杆。" },
        { lvl: "L1", when: "级联开始", who: "市场风险", action: "加宽、在争议估值上暂停强平、改限价。" },
        { lvl: "L2", when: "保险 < 突破", who: "首席风险官", action: "向基金注资或降低产品风险。" },
        { lvl: "L3", when: "使用自动减仓", who: "合规 + 产品", action: "客户沟通；审计排名。" },
        { lvl: "L4", when: "错误估值造成客户损害", who: "法务", action: "赔偿；暂停产品。" },
        { lvl: "L5", when: "系统性", who: "董事会 / 监管", action: "若当地规则要求，通知监管。" }
      ],
      countermeasures: ["用限价 / 分批手数强平，而不是一笔市价。", "综合价偏离时冻结估值并暂缓强平。", "动态杠杆：风险持仓上升时削减最大杠杆。", "按压力测试给保险基金定规模（见现有 stress_testing.py 模式）。", "保险之后才自动减仓；公布排名公式；无 VIP 豁免。", "在牌照允许处，先部分平仓与追保，再全额消灭。"]
    },
    {
      id: "cfd-b-book-conflict", code: "TRN-CFD-09", name: "B 簿冲突、有毒流量过滤与平台摩擦",
      severity: "high", products: ["spot", "margin", "perps"],
      summary: "公司做客户对手方，再用最后一瞥、更宽点差、改价、“平台冻结”或延迟对冲留下会赢的流量，把会输的流量丢给 LP。",
      why: "混合 A/B 簿是常态。滥用是选择性摩擦与信息使用：经纪商知道客户账本，也知道更快的对冲路径。",
      workflow: [
        { n: "01", who: "路由器", action: "给每个客户打分（胜率、markout、新闻交易）。容易流量留 B 簿；有毒走 A 簿 / LP。", tell: "成交质量与点差按客户分层显著不同。" },
        { n: "02", who: "B 簿", action: "对会赢客户的交易按住或加宽；对会输客户即时成交。", tell: "时延与拒单按客户分数不对称。" },
        { n: "03", who: "对冲台", action: "当 B 簿客户突然对了（新闻），在波动之后把风险甩给 LP。", tell: "对冲打印在客户成交之后；容易流量从不提前，有毒流量总是滞后。" },
        { n: "04", who: "平台", action: "可选：仅在新闻时对有毒分层报价冻结、断线或加宽。", tell: "故障工单在数据公布时聚集在盈利客户上。" },
        { n: "05", who: "财务", action: "公司损益 ≈ 零售损益的相反数，再减去有毒尾巴的对冲成本。", tell: "管理账上的财富转移形态。" }
      ],
      participants: [
        { role: "混合簿路由器", incentive: "最大化库存优势。" },
        { role: "下游 LP", incentive: "只收到有毒尾巴——会最后一瞥或切断经纪商。" },
        { role: "零售（容易）", incentive: "以为与专业客户同一价格。" },
        { role: "专业 / 剥头皮", incentive: "被过滤；仍可能被宣传为“DMA”。" },
        { role: "操守 / 最佳执行", incentive: "必须展示公平对待与披露。" }
      ],
      detection: {
        tools: ["客户级成交分析（持有、点差、拒单、滑点）", "每笔成交的 A/B 簿标记", "对冲滞后 vs 客户成交", "故障工单 vs 新闻日历", "分层点差热图"],
        parameters: [
          { metric: "有毒 vs 容易十分位所付点差", window: "周", warn: "同品种同时段有毒支付 > 容易 1.5 倍", breach: "> 2.5 倍且无披露分层", notes: "分层必须写进合同。" },
          { metric: "新闻窗口拒单 / 断线率按分层", window: "公布前 1 分到后 3 分", warn: "有毒断线为容易的 3 倍", breach: "只有有毒账户“掉线”", notes: "平台完整性。" },
          { metric: "对冲滞后", window: "每笔 B 簿成交", warn: "新闻中位数滞后 > 2 秒，安静有毒 < 50 毫秒", breach: "仅在不利波动后对冲", notes: "抢跑式对冲。" },
          { metric: "公司损益 / 客户亏损比", window: "月", warn: "> 0.55", breach: "> 0.75 且营销为“代理”", notes: "披露不符。" },
          { metric: "滑点符号", window: "日", warn: "B 簿正滑点罕见", breach: "1 万笔以上零正滑点", notes: "单向管道。" }
        ]
      },
      escalation: [
        { lvl: "L0", when: "每日", who: "系统", action: "向风险官与操守发送分层成交分析包。" },
        { lvl: "L1", when: "周", who: "最佳执行委员会", action: "质询路由设置。" },
        { lvl: "L2", when: "事件", who: "技术 + 合规", action: "冻结取证；时钟同步日志。" },
        { lvl: "L3", when: "错误营销", who: "法务", action: "改话术；可能救济。" },
        { lvl: "L4", when: "系统性损害", who: "董事会", action: "在该产品关闭 B 簿或改为代理。" },
        { lvl: "L5", when: "监管关注", who: "合规", action: "通知 / 回应操守监管。" }
      ],
      countermeasures: ["用白话披露混合簿记；若走 B 簿不要宣传 DMA。", "同一产品所有分层同一报价路径与持有上限，或公布付费档位。", "禁止按客户选择的新闻窗口断线。", "对冲计时：若做 B 簿，须自担风险最短持有（如 1–5 秒），否则就是代理。", "市价单正滑点对称。", "独立操守管理信息：公司损益 vs 客户，由二道防线审阅——不是交易台。"]
    },
    {
      id: "cfd-quote-stuff", code: "TRN-CFD-10", name: "报价灌水与时延游戏",
      severity: "elevated", products: ["spot", "margin", "perps", "futures"],
      summary: "海量增撤报文或振荡报价损害他人读盘能力，然后一笔快速单吃掉真实流动性。",
      why: "零售 CFD 界面较少见，DMA 期货、外汇 ECN 与 API 永续常见。灌水是时延武器，不是方向观点。",
      workflow: [
        { n: "01", who: "高频客户", action: "找到 CPU/网络受限的网关或 LP。", tell: "报文率接近场所上限。" },
        { n: "02", who: "算法", action: "在一个或多个品种上高速爆发增撤或闪烁报价。", tell: "报文远大于成交；盘口闪烁；他人改撤滞后。" },
        { n: "03", who: "受害者", action: "变慢、撤报价，或按过时视图交易。", tell: "做市商撤离；除灌水者外所有人点差变宽。" },
        { n: "04", who: "灌水者", action: "走更快路径击中剩余确定报价。", tell: "其成交率恰好在爆发窗口上升。" }
      ],
      participants: [
        { role: "低时延客户", incentive: "制造私人慢市。" },
        { role: "LP / 做市商", incentive: "必须淡出或被捡漏。" },
        { role: "场所 / 经纪网关", incentive: "必须监管报文预算。" }
      ],
      detection: {
        tools: ["每会话报文率监测", "撤/增爆发", "网关时延膨胀", "SMARTS 报价灌水", "每品种闪烁指标"],
        parameters: [
          { metric: "每账户每秒报文", window: "100 毫秒–1 秒桶", warn: "DMA 外汇 > 200；按场所调", breach: "> 500 或紧贴场所上限", notes: "由容量测试设定。" },
          { metric: "成交 / 报文", window: "爆发", warn: "< 0.5%", breach: "< 0.1% 且闪烁", notes: "无意成交。" },
          { metric: "同伴时延膨胀", window: "同一桶", warn: "网关 p99 +2 倍", breach: "+5 倍且与一账户重合", notes: "损害证据。" },
          { metric: "闪烁（无成交的中间价变化）", window: "1 秒", warn: "> 20", breach: "> 50", notes: "振荡。" }
        ]
      },
      escalation: [
        { lvl: "L0", when: "实时", who: "系统", action: "预警限流会话；突破断开。" },
        { lvl: "L1", when: "小时", who: "监察", action: "确认并非失控算法（仍须制裁）。" },
        { lvl: "L2", when: "重复", who: "风险官", action: "暂停 DMA。" },
        { lvl: "L3", when: "场所损害", who: "合规", action: "通知场所；若适用则立 MAR 分层/灌水档。" },
        { lvl: "L4", when: "失控风险", who: "技术", action: "熔断、报文费。" },
        { lvl: "L5", when: "上市市场", who: "法务", action: "配合交易所调查。" }
      ],
      countermeasures: ["硬性报文预算与撤增费用。", "可见报价最短存活。", "每会话 CPU 隔离，使单一客户不能拖垮他人。", "对失控撤单循环设置熔断。", "不要给零售 API 与托管 DMA 同样未限流的消防水带。"]
    }
  ],
  crypto: [
    {
      id: "cex-wash", code: "TRN-CEX-01", name: "对倒与粉饰成交量",
      severity: "critical", products: ["tokens", "perps", "tokenised"],
      summary: "同一受益所有人（或场所自身）既买又卖，使成交量、排名与“流动性”看起来真实。价格几乎不动。",
      why: "上币、做市合同、CoinMarketCap/CoinGecko 排名与上币政治用成交量支付。代币化 RWA 用同一手法伪造二级流动性。",
      workflow: [
        { n: "01", who: "发行方 / 做市 / 场所", action: "需要成交量来换排名、上币或做市返佣档。", tell: "合同或 KPI 以成交量为准。" },
        { n: "02", who: "集群", action: "给若干账户注资（或场所金库对做市商）。", tell: "热钱包循环；存款来自同一簇。" },
        { n: "03", who: "机器人", action: "打印很紧的买卖并在价差内或价差上 24/7 互为对手。", tell: "量大、价格冲击≈0，每个机器人库存均值回归。" },
        { n: "04", who: "散户 / 聚合器", action: "看到“很深”的市场；真实退出规模极小。", tell: "真实 5–10 万手数就会打出缺口；粉饰量消失。" },
        { n: "05", who: "代币化资产变体", action: "对倒二级池，使 RWA 对净值或包装伙伴显得可流动。", tell: "链上转账在少数地址循环；中心化交易所打印与这些循环吻合。" }
      ],
      participants: [
        { role: "项目 / 发行方", incentive: "排名、上币、叙事。" },
        { role: "合同做市商", incentive: "成交量返佣，或合同写“维持 0.1% 点差与 X 美元日均量”。" },
        { role: "场所（最坏情况）", incentive: "伪造盘口以吸引上币与散户。" },
        { role: "对倒即服务农场", incentive: "用代币支付。" },
        { role: "使用该盘口的散户 / 出借人", incentive: "被误导退出流动性。" }
      ],
      detection: {
        tools: ["Solidus Labs HAL 对倒分", "Kaiko / Coin Metrics 成交质量", "内部自成交与共同受益人引擎", "链上聚类（Chainalysis、TRM、Nansen）", "订单 ID 微观结构（点差、冲击、到达间隔）"],
        parameters: [
          { metric: "自成交 / 关联成交占成交量", window: "1 小时 / 24 小时", warn: "> 15%", breach: "> 30% 或场所做市 vs 场所金库 > 20%", notes: "用最终受益人 + 存款图谱，不只相同 UID。" },
          { metric: "Kyle λ / 单位成交冲击", window: "日 vs 同业", warn: "冲击在最差十分位而日均量在最好十分位", breach: "近零冲击却有上四分位日均量", notes: "粉饰盘口。" },
          { metric: "做市账户库存均值回归", window: "4 小时", warn: "半衰期 < 10 分钟且净≈0", breach: "再加高报撤比且无外部对冲打印", notes: "闭环。" },
          { metric: "成交规模熵 / 周期性", window: "24 小时", warn: "强 1 秒或 5 秒周期", breach: "全天节拍器式 ±1 跳成交", notes: "机器人指纹。" },
          { metric: "链上循环分（代币化）", window: "24 小时", warn: "前 5 地址 > 转账 50%", breach: "> 75% 且中心化交易所存取款吻合", notes: "RWA 假流通。" }
        ]
      },
      escalation: [
        { lvl: "L0", when: "每小时", who: "系统", action: "每交易对对倒记分牌；预警则从“成交量榜”隐藏。" },
        { lvl: "L1", when: "24 小时", who: "市场质量", action: "审查做市合同；索取对冲证据。" },
        { lvl: "L2", when: "确认", who: "监察 + 上币", action: "移出排名；追回返佣。" },
        { lvl: "L3", when: "发行方主导", who: "合规", action: "代币项目档案；可能市场滥用报告。" },
        { lvl: "L4", when: "场所主导", who: "法务 + 董事会", action: "停止内部粉饰；外部审计成交量。" },
        { lvl: "L5", when: "投资者损害 / 上币欺诈", who: "法务", action: "监管、上币伙伴、数据聚合器。" }
      ],
      countermeasures: ["按质量（真实紧点差 + 外部对冲 + 冲击）支付做市，而不是原始日均量。", "自成交防护跑在存款地址图谱上。", "不要把你知道是关联方的“成交量”卖给聚合器。", "代币化资产：披露真实自由流通与关联成交。", "监察公布：质量成交 vs 总成交。", "取消经济倒置的返佣档（返佣 > 费用 + 点差）。"]
    },
    {
      id: "cex-pump", code: "TRN-CEX-02", name: "协同拉盘砸盘与社交点火",
      severity: "critical", products: ["tokens"],
      summary: "一小撮人悄悄吸筹，再在定时社交爆破（Telegram、Discord、KOL）点燃散户，内部人在尖峰派发。",
      why: "低流通代币与新上山寨币便宜可推。代币化“迷因 RWA”与包装代币同样待遇。",
      workflow: [
        { n: "01", who: "内圈", action: "在中心化、去中心化与场外吸筹。常在上币锁定期或“合作”推文之前。", tell: "隐蔽买入、场外台、关联钱包。" },
        { n: "02", who: "操盘手", action: "播种聊天室、机器人与付费 KOL；约定时间（“18:00 UTC 拉盘”）。", tell: "各房间文案相同；付费推广钱包。" },
        { n: "03", who: "外圈 / 散户", action: "FOMO 市价买入；滑点爆炸；若有永续则资金费翻转。", tell: "散户 UID、小手数、社交量尖峰。" },
        { n: "04", who: "内圈", action: "向买盘派发；有时幌骗一堵随即消失的买墙。", tell: "吸筹钱包大额卖出；墙被撤。" },
        { n: "05", who: "余波", action: "价格崩塌；团伙给下一代码换皮。", tell: "同一管理号，新合约。" }
      ],
      participants: [
        { role: "内圈 / 内部人", incentive: "退出流动性。" },
        { role: "付费 KOL / 喊单群", incentive: "代币或 USDT 报酬。" },
        { role: "做市商（若串通）", incentive: "加宽收割，或帮忙粉饰开盘。" },
        { role: "散户外圈", incentive: "以为自己来得早。" },
        { role: "交易所上币 / 市场", incentive: "不得放大已知拉盘。" }
      ],
      detection: {
        tools: ["社交量（LunarCrush、自研抓取）", "钱包吸筹图谱", "上币/公告日历拼接", "Solidus 拉盘砸盘", "永续资金费 + 现货领先滞后"],
        parameters: [
          { metric: "社交提及 / 独立作者", window: "1 小时", warn: "提及达 30 日基线 5 倍且独立作者增长低", breach: "提及 10 倍，复制粘贴比 > 40%", notes: "机器人网。" },
          { metric: "尖峰中吸筹钱包派发", window: "T0–T+60 分", warn: "拉盘前顶级钱包提供卖出名义 > 25%", breach: "> 40%", notes: "内圈退出。" },
          { metric: "先涨后崩", window: "4 小时", warn: "+40% 然后 −25%", breach: "低流通上 +80% 然后 −50%", notes: "经典形态。" },
          { metric: "KOL 支付轨迹", window: "前 7 日", warn: "代币转到已知推广簇", breach: "合同发票 + 定时发帖", notes: "场外证据。" },
          { metric: "新用户集中度", window: "事件", warn: "> 买入名义 30% 来自开户 < 7 日账户", breach: "> 50%", notes: "外圈。" }
        ]
      },
      escalation: [
        { lvl: "L0", when: "实时", who: "系统", action: "轻度停牌：加宽、降杠杆、交易对风险横幅。" },
        { lvl: "L1", when: "数分钟", who: "监察 + 信任", action: "若条款允许，冻结内圈钱包提现。" },
        { lvl: "L2", when: "数小时", who: "上币", action: "下币路径；取消市场放大。" },
        { lvl: "L3", when: "确认协同", who: "合规 / 反洗钱官", action: "立案；若在官方频道则保全聊天。" },
        { lvl: "L4", when: "员工 / 上币泄露", who: "法务 + 人事", action: "内幕交易档案。" },
        { lvl: "L5", when: "大规模散户损害", who: "法务", action: "监管 / 执法，尤其涉及法币通道时。" }
      ],
      countermeasures: ["上币锁仓与分阶段解锁，钱包公开。", "冷静期：新上币降低杠杆，大额卖方延迟提现。", "市场部门不得转发付费喊单群。", "把内部人与做市钱包的链上监控写成上币契约。", "当社交 z 分数与收益走出拉盘形态时显示风险横幅。", "条款允许追回仍在场所上的对倒/拉盘所得。"]
    },
    {
      id: "cex-spoof", code: "TRN-CEX-03", name: "幌骗、冰山淡出与多簿分层",
      severity: "high", products: ["tokens", "perps", "tokenised"],
      summary: "与 CFD 幌骗同一经济逻辑，再加上子账户、现货簿与永续簿，以及可作为“真实侧”的 DEX 池。",
      why: "加密盘口 24/7，常很薄，用户可开许多 UID。跨产品幌骗：现货假买，永续真卖（或相反）。",
      workflow: [
        { n: "01", who: "交易员", action: "开或租若干 UID；可选加一个 DEX 钱包。", tell: "共享 KYC、设备或提现地址。" },
        { n: "02", who: "算法", action: "在可见中心化盘口分层；把真实意图藏在永续、期权或 DEX。", tell: "现货深度单边；永续对侧主动。" },
        { n: "03", who: "市场", action: "散户与跟单机器人靠向墙。", tell: "跟风者；标记价朝假墙移动。" },
        { n: "04", who: "交易员", action: "击中真实场所/产品；撤销中心化分层。", tell: "跨产品成交后撤单聚集。" }
      ],
      participants: [
        { role: "多账户交易者", incentive: "推动估值或成交而不暴露意图。" },
        { role: "跟单机器人", incentive: "跟随可见量——被收割。" },
        { role: "场所撮合引擎", incentive: "必须防止自成交与关联幌骗。" }
      ],
      detection: {
        tools: ["L3 回放", "跨产品告警（现货分层 + 永续主动）", "子账户图谱", "Eventus / Solidus 幌骗", "DEX 成交拼接（EigenPhi / 内部索引）"],
        parameters: [
          { metric: "报撤比与撤单时延", window: "5 分钟", warn: "报撤比 > 20:1，撤单时延 < 1 秒", breach: "报撤比 > 40:1 + 对侧成交", notes: "按最小跳动调。" },
          { metric: "跨簿意图翻转", window: "10 秒", warn: "现货可见量 5 倍且永续对侧主动", breach: "再加永续成交后撤销现货", notes: "多产品幌骗。" },
          { metric: "关联 UID 分层", window: "2 秒", warn: "2 个 UID", breach: "3 个以上同一指纹", notes: "子账户政策。" },
          { metric: "墙从不成交", window: "情节", warn: "墙成交 < 5%", breach: "每日 ≥3 次情节为 0%", notes: "意图。" }
        ]
      },
      escalation: [
        { lvl: "L0", when: "实时", who: "系统", action: "告警 + 盘口快照。" },
        { lvl: "L1", when: "30 分钟", who: "监察", action: "回放；扩展关联 UID。" },
        { lvl: "L2", when: "重复", who: "信任", action: "封 API，降低速率。" },
        { lvl: "L3", when: "估值被推 / 强平", who: "合规", action: "滥用立案；若基于标记价的强平已触发则考虑成交撤销。" },
        { lvl: "L4", when: "VIP 做市", who: "上币 + 法务", action: "做市合同违约。" },
        { lvl: "L5", when: "上市证券型代币", who: "法务", action: "证券市场滥用路径。" }
      ],
      countermeasures: ["报撤比与自成交做关联账户聚合。", "超过名义的挂单设最短停留。", "若同时上市现货 + 永续，跨产品监察是必须的。", "不要展示同时有隐藏永续风险的账户的可幌骗“总深度”。", "限制撤单风暴。"]
    },
    {
      id: "cex-oracle-mark", code: "TRN-CEX-04", name: "预言机、指数与标记价操纵",
      severity: "critical", products: ["perps", "tokens", "tokenised"],
      summary: "有人推动标记价、指数或预言机的成分，使强平、资金费、结构化产品或 RWA 净值跟随并非共识的打印。",
      why: "永续标记价、期权结算、借贷抵押率与代币化资产净值都是公式。薄成分与过短时间加权是攻击面——包括漏进中心化指数的闪电贷 DEX 打印。",
      workflow: [
        { n: "01", who: "攻击者", action: "阅读指数方法（场所、权重、过时、时间加权长度）。", tell: "公开文档或泄露权重；小场所仍有权重。" },
        { n: "02", who: "攻击者", action: "开出在标记价移动时赔付的衍生品或借贷（永续、期权、借贷强平、净值赎回）。", tell: "大永续或借贷 vs 薄指数成分。" },
        { n: "03", who: "攻击者", action: "打印薄弱成分：在小交易所对倒，或兑换预言机读取的 DEX 池，有时用闪电贷。", tell: "一个场所尖峰；其他没有。" },
        { n: "04", who: "引擎", action: "标记/净值/抵押率跳升；强平或资金费触发。", tell: "综合价从未确认的打印上出现强平级联。" },
        { n: "05", who: "攻击者", action: "撤回打印；留下衍生品利润。", tell: "成分回归；永续损益留下。" }
      ],
      participants: [
        { role: "指数 / 预言机设计者", incentive: "必须假设对抗性打印。" },
        { role: "带杠杆的攻击者", incentive: "衍生品收益远大于推动薄来源的成本。" },
        { role: "小场所 / DEX 池", incentive: "可能被收买，或只是薄。" },
        { role: "借款人 / 多头", incentive: "在假估值上被强平。" },
        { role: "RWA 发行方（代币化）", incentive: "用了糟糕二级打印的净值。" }
      ],
      detection: {
        tools: ["综合价 vs 成分看板", "Chaos Labs / Gauntlet 风格预言机监测", "Chainlink / Pyth / RedStone 偏离告警", "闪电贷 + 兑换追踪（Forta、EigenPhi）", "内部估值 vs 前 N 中位数"],
        parameters: [
          { metric: "成分相对中位数偏离", window: "1 秒–1 分钟", warn: "大盘 > 30 个基点 / 中盘 > 80", breach: "> 80 / > 150——踢出来源", notes: "硬排除，不要只是事后降权。" },
          { metric: "时间加权窗口 vs 攻击持续", window: "设计", warn: "你不控制的场所时间加权 < 5 分钟", breach: "可闪电贷的 DEX 上用最新价或 1 分钟时间加权", notes: "设计突破。" },
          { metric: "同一区块 / 同一分钟闪电贷 + 预言机读取", window: "链上", warn: "任何", breach: "再加中心化标记移动 / 强平", notes: "原子或近原子。" },
          { metric: "强平时估值 vs 稳健综合价", window: "事件", warn: "> 20 个基点", breach: "> 50 个基点——冻结强平", notes: "与 CFD 估值冻结相同。" },
          { metric: "RWA 净值 vs 鉴证 / 一级市场", window: "每日 / 每小时", warn: "> 50 个基点", breach: "> 150 个基点，或鉴证过时 > 24 小时（日内 RWA）/ > T+2（基金）", notes: "代币化特有。" }
        ]
      },
      escalation: [
        { lvl: "L0", when: "逐笔", who: "系统", action: "丢弃偏离来源；冻结估值；暂停强平。" },
        { lvl: "L1", when: "数分钟", who: "市场风险", action: "确认是事件还是中断。" },
        { lvl: "L2", when: "当日", who: "监察", action: "谁在永续/借贷/净值上受益？" },
        { lvl: "L3", when: "客户损害", who: "合规", action: "成交撤销或重新强平政策；沟通。" },
        { lvl: "L4", when: "方法漏洞", who: "产品", action: "改指数；移除场所；拉长时间加权。" },
        { lvl: "L5", when: "RWA / 证券型代币", who: "法务 + 发行方", action: "鉴证重述；若需要则通知监管。" }
      ],
      countermeasures: ["至少 5 个高质量场所的中位数；最大权重 25–30%；偏离立即排除。", "时间加权/指数加权要长到闪电打印无法主导（资金费常 15–60 分钟；强平可更短但须综合价，不是单一盘口）。", "永远不要把可闪电贷的现货当最新价读取。", "代币化资产：净值来自一级/已鉴证净值，不是薄的中心化二级打印。", "标记价速度熔断。", "若强平打在后来被否定的估值上，保险 / 追回。"]
    },
    {
      id: "cex-funding", code: "TRN-CEX-05", name: "永续资金费率攻击",
      severity: "high", products: ["perps"],
      summary: "停放主导一侧持仓，并/或轻推溢价指数，从而从拥挤的另一侧抽取资金费。",
      why: "加密永续每 1–8 小时付资金费。薄山寨的溢价窗口极短。再叠加现货对倒，溢价很便宜伪造。",
      workflow: [
        { n: "01", who: "农民", action: "选持仓低、溢价时间加权短的山寨永续。", tell: "持仓相对现货日均量别扭；公式公开。" },
        { n: "02", who: "农民", action: "建立大额单边永续；可选在不付资金费的现货/场外对冲。", tell: "持仓份额进入窗口时上升。" },
        { n: "03", who: "农民", action: "粉饰现货或溢价所用成分，使资金费翻转。", tell: "单一场所现货暴涨；溢价仅在时间加权中尖峰。" },
        { n: "04", who: "引擎", action: "支付资金费。", tell: "支付远大于粉饰成本。" },
        { n: "05", who: "农民", action: "两边压平。", tell: "整点后持仓下降。" }
      ],
      participants: [
        { role: "资金费农民 / 基差台", incentive: "收割公式。" },
        { role: "拥挤的散户一侧", incentive: "支付被制造的费率。" },
        { role: "场所", incentive: "必须夹断并稳健化指数。" }
      ],
      detection: {
        tools: ["资金费窗口持仓份额", "溢价 vs 多场所基差", "现货对倒拼接", "之后压平检测", "跨所资金费套利看板（Laevitas、Coinglass——仅作背景，不是真相）"],
        parameters: [
          { metric: "T-30 分持仓份额", window: "每次资金费", warn: "> 20%", breach: "簇 > 35%", notes: "关联 UID。" },
          { metric: "T+20 分压平", window: "之后", warn: "> 50%", breach: "> 80%", notes: "收割。" },
          { metric: "溢价 vs 5 场所基差", window: "时间加权", warn: "|z| > 3", breach: "|z| > 5 或由单一场所驱动", notes: "粉饰。" },
          { metric: "资金费 vs 已实现 8 小时收益", window: "周", warn: "资金费持续单向而价格均值回归", breach: "再加同一簇总在收取侧", notes: "抽取。" },
          { metric: "夹断触发", window: "日", warn: "单一品种频繁夹断", breach: "夹断 + 同一农民", notes: "公式仍漏。" }
        ]
      },
      escalation: [
        { lvl: "L0", when: "每个窗口", who: "系统", action: "农民名单。" },
        { lvl: "L1", when: "+1 小时", who: "监察", action: "现货粉饰拼接。" },
        { lvl: "L2", when: "重复", who: "风险", action: "限制持仓份额；改时间加权。" },
        { lvl: "L3", when: "客户损害", who: "合规", action: "考虑对该窗口重述资金费。" },
        { lvl: "L4", when: "结构性", who: "产品", action: "利率 + 夹断 + 更长窗口。" },
        { lvl: "L5", when: "若代币是证券", who: "法务", action: "按当地法做滥用分析。" }
      ],
      countermeasures: ["多场所溢价、30–60 分钟时间加权、每区间夹断。", "窗口内持仓份额上限。", "仅骑快照开平的惩罚费。", "不要让可对倒的现货场所主导溢价。", "稳定币资金费对齐外部利率（类 SOFR 或借贷利率）再加基差，而不是最新价。"]
    },
    {
      id: "cex-liq-adl", code: "TRN-CEX-06", name: "猎杀强平、抽干保险与自动减仓滥用",
      severity: "critical", products: ["perps", "tokens"],
      summary: "把估值推进强平口袋，收割引擎，抽干保险基金，或玩弄自动减仓排名（含 VIP 豁免）。",
      why: "加密永续宣传 20–100 倍。强平地图公开。保险基金与自动减仓不透明——是特权面。",
      workflow: [
        { n: "01", who: "猎手", action: "阅读公开强平图与场内持仓。", tell: "热图水平；杠杆拥挤。" },
        { n: "02", who: "猎手", action: "轻推估值（现货粉饰、幌骗、主动手数）。", tell: "第一批强平触发。" },
        { n: "03", who: "引擎", action: "市价倾泻给猎手或串通做市商。", tell: "强平打印抬起猎手的挂单流动性。" },
        { n: "04", who: "若仍有空洞", action: "保险支付；若空则自动减仓打对手方。", tell: "基金下台阶；自动减仓事件。" },
        { n: "05", who: "特权路径", action: "VIP / 公司账户避开自动减仓或先拿到强平流量。", tell: "排名残差无法解释。" }
      ],
      participants: [
        { role: "强平猎手", incentive: "做强迫流量的买方。" },
        { role: "高杠杆用户", incentive: "燃料。" },
        { role: "保险基金", incentive: "托底——可能定错规模。" },
        { role: "自动减仓对手方", incentive: "要公平排名。" },
        { role: "VIP 台（冲突）", incentive: "优先撮合或跳过自动减仓。" }
      ],
      detection: {
        tools: ["内部强平阶梯", "保险跑道", "自动减仓排名解释器", "估值冻结", "VIP vs 散户在强平中的成交审计"],
        parameters: [
          { metric: "1% 内风险持仓", window: "实时", warn: "> 12%", breach: "> 20%", notes: "削减杠杆。" },
          { metric: "猎手占强平成交份额", window: "事件", warn: "> 25%", breach: "一簇 > 40%", notes: "他们在等。" },
          { metric: "保险 / 99% 一日残值", window: "每日压力", warn: "< 3 倍", breach: "< 1 倍", notes: "给基金注资。" },
          { metric: "自动减仓豁免", window: "每次自动减仓", warn: "任何未记录的跳过", breach: "VIP/公司跳过", notes: "操守。" },
          { metric: "估值 vs 综合价", window: "事件", warn: "> 40 个基点", breach: "> 100 个基点冻结", notes: "错误估值。" }
        ]
      },
      escalation: [
        { lvl: "L0", when: "始终", who: "系统", action: "动态杠杆 + 估值冻结。" },
        { lvl: "L1", when: "猎杀事件", who: "风险", action: "分批剩余强平。" },
        { lvl: "L2", when: "保险预警", who: "首席风险官", action: "注资或下架高杠杆。" },
        { lvl: "L3", when: "自动减仓", who: "合规", action: "公布排名；客户沟通。" },
        { lvl: "L4", when: "VIP 特权", who: "法务 + 首席执行官", action: "取消豁免；救济。" },
        { lvl: "L5", when: "偿付能力风险", who: "董事会", action: "停产品；监管。" }
      ],
      countermeasures: ["停止发布精确到跳动的强平图。", "分批限价强平；逐仓 vs 全仓控制。", "无自动减仓 VIP 豁免；公式上网站并写入日志。", "按压力而不是营销给保险定规模。", "风险持仓上升时降低最大杠杆。", "按比例或拍卖强平，而不是“谁最快谁吃”。"]
    },
    {
      id: "cex-rwa", code: "TRN-CEX-07", name: "代币化资产净值、储备与鉴证欺诈",
      severity: "critical", products: ["tokenised"],
      summary: "声称是现金、国债、黄金、基金、房地产或包装 BTC/ETH 的代币其实无储备、被再抵押、按过时或关联净值估值，或由被俘获流程鉴证。",
      why: "代币化 RWA 与包装物是穿着代币的资产负债表产品。市场犯罪常常是欺诈与披露，然后才是二级上的交易滥用。",
      workflow: [
        { n: "01", who: "发行方", action: "对照所称储备铸造代币（银行现金、票据、金库金属、BTC、基金份额）。", tell: "铸造地址、托管名称、鉴证 PDF。" },
        { n: "02", who: "弱控制", action: "储备被复用、出借、混同或根本不存在；或净值由关联台估值。", tell: "鉴证滞后、选所、只证明余额不证明所有权。" },
        { n: "03", who: "二级", action: "对倒中心化/去中心化盘口，使代币“按净值交易”。", tell: "关联成交；自由流通极小。" },
        { n: "04", who: "压力", action: "赎回设闸；二级脱锚；把该代币当抵押的借贷市场级联。", tell: "排队、削发、脱锚。" },
        { n: "05", who: "内部人", action: "经仍流动的交易对或关联做市退出。", tell: "内部钱包先赎回或先卖。" }
      ],
      participants: [
        { role: "发行方 / 发起人", incentive: "铸币税、管理费。" },
        { role: "托管 / 次托管", incentive: "可能再抵押。" },
        { role: "鉴证人 / 审计", incentive: "范围很窄；时点 PDF。" },
        { role: "授权参与人 / 做市", incentive: "铸造赎回套利——或对倒。" },
        { role: "借贷协议 / 交易所理财", incentive: "把代币当现金等价物接受。" },
        { role: "持有人", incentive: "以为自己持有资产。" }
      ],
      detection: {
        tools: ["Chainlink 储备证明 + 独立钱包盯梢", "银行/托管确认（不要截图）", "铸造赎回 vs 储备增量", "TRM/Chainalysis 看储备钱包", "净值 vs 综合二级价", "鉴证日历监测"],
        parameters: [
          { metric: "链上供给 vs 已鉴证储备", window: "每次鉴证 + 持续储备证明", warn: "缺口 > 25 个基点", breach: "缺口 > 100 个基点或储备钱包无解释移动", notes: "包含待铸造。" },
          { metric: "鉴证账龄", window: "持续", warn: "类现金 > 7 日；基金 > 30 日", breach: "类现金 > 30 日；意见缺失；审计辞职", notes: "过时 = 不可信。" },
          { metric: "关联方占二级成交", window: "7 日", warn: "> 30%", breach: "> 60%", notes: "假净值锚定。" },
          { metric: "赎回滞后 vs 披露 T+", window: "每次请求", warn: "逾期 +1 日", breach: "无披露触发却设闸", notes: "流动性谎言。" },
          { metric: "抵押使用 vs 自由储备", window: "每日", warn: "他处作抵押超出披露", breach: "宣传 1:1 隔离却再抵押 > 0", notes: "欺诈。" },
          { metric: "净值 vs 标的独立价格", window: "每日", warn: "无法解释 > 30 个基点", breach: "> 100 个基点或总是对发行方有利", notes: "估值滥用。" }
        ]
      },
      escalation: [
        { lvl: "L0", when: "持续", who: "系统", action: "储备证明 / 供给差额告警；脱锚告警。" },
        { lvl: "L1", when: "数小时", who: "托管 + 风险", action: "暂停新增为抵押；提高削发。" },
        { lvl: "L2", when: "当日", who: "上币 + 合规", action: "索取原始储备证据；若你是发行场所则暂停铸造。" },
        { lvl: "L3", when: "缺口确认", who: "反洗钱官 + 法务", action: "冻结发行/做市账户；客户沟通。" },
        { lvl: "L4", when: "脱锚 / 设闸", who: "首席风险官", action: "取消保证金抵押资格；隔离市场。" },
        { lvl: "L5", when: "资产缺失", who: "法务", action: "监管、执法、破产路径。" }
      ],
      countermeasures: ["把代币化现金、票据、黄金、基金与包装物当信用产品：削发、集中度上限、抵押熔断。", "要求持续储备证明，外加定期独立所有权确认（不只是余额）。", "仅对照预注资隔离账户铸造赎回；每个铸造先与储备增量对账再上线。", "禁止把关联成交用于“按净值交易”营销与抵押合格测试。", "公开、机器可读的鉴证日历；错过日期自动降级代币。", "若你把它当现金等价物上市，你就拥有穿透义务。无法穿透，它就是风险资产。"]
    },
    {
      id: "cex-insider-unlock", code: "TRN-CEX-08", name: "内部上币、泄露与解锁抛售",
      severity: "high", products: ["tokens", "tokenised"],
      summary: "员工、上币代理或内部人在上币、档位升级或代币解锁前吸筹，再在公告中派发。解锁悬崖是同一交易的日程版。",
      why: "上币与解锁日历是加密里最可预测的催化剂。交易所信息墙弱于传统上市场所。代币化基金份额在“上线”前后有同样泄露。",
      workflow: [
        { n: "01", who: "内部人 / 代理", action: "在对公众代码之前获知上币、交易对、种子或解锁。", tell: "上币 CRM 工单；与项目的 Telegram；解锁 JSON。" },
        { n: "02", who: "内部人", action: "在 DEX、较小中心化所或场外用其他 UID/钱包买入。", tell: "随后充入上币场所的钱包；员工设备重叠。" },
        { n: "03", who: "场所 / 项目", action: "公告；开盘或解锁进入流通。", tell: "跳空；社交爆破。" },
        { n: "04", who: "内部人", action: "卖新闻；有时配一堵幌骗买墙。", tell: "公告前钱包成为卖方。" },
        { n: "05", who: "解锁变体", action: "团队 / 投资人钱包在悬崖抛售，做市“护盘”后让开。", tell: "已知解锁钱包、供给冲击、永续基差爆发。" }
      ],
      participants: [
        { role: "交易所上币 / 商务 / 市场", incentive: "小金库或“台里的朋友”。" },
        { role: "项目团队 / 风投", incentive: "解锁流动性。" },
        { role: "场外经纪", incentive: "看见流量，可能搭便车。" },
        { role: "开盘散户", incentive: "买标题。" },
        { role: "合规 / 监察", incentive: "需要个人账户交易与钱包申报。" }
      ],
      detection: {
        tools: ["员工个人账户 + 钱包申报 vs 链", "公告前吸筹（Nansen、TRM）", "解锁日历（TokenUnlocks）拼接卖盘", "上币 CRM 访问日志", "上币前 < 14 日开户的异常盈利"],
        parameters: [
          { metric: "关联钱包公告前超额收益", window: "T-14 日到 T0", warn: "相对贝塔 >+15%", breach: ">+40% 且这些钱包在 T0–T+4 小时卖出", notes: "内部人形态。" },
          { metric: "员工 CRM 访问后个人交易", window: "T-30 日", warn: "任何访问 + 该代币任何个人交易", breach: "访问 + 盈利交易且无预批准", notes: "个人账户违约。" },
          { metric: "解锁钱包卖出 / 解锁量", window: "T0–T+24 小时", warn: "> 20%", breach: "> 40% 或隐蔽场外再进中心化所", notes: "日程抛售。" },
          { metric: "上币日新 UID 损益", window: "T0", warn: "开户 < 14 日账户进入损益前十分位", breach: "再加与员工或项目共享设备", notes: "马甲。" },
          { metric: "代币化上币泄露", window: "T-10 日", warn: "官方上线前已有二级打印", breach: "授权参与人/做市先买标的再买代币", notes: "与净值抢跑相同。" }
        ]
      },
      escalation: [
        { lvl: "L0", when: "每次上币 / 解锁", who: "系统", action: "观察名单钱包 + 员工个人账户匹配。" },
        { lvl: "L1", when: "T+4 小时", who: "监察", action: "异常盘前交易包。" },
        { lvl: "L2", when: "员工重叠", who: "合规 + 人事", action: "设备/取证；暂停权限。" },
        { lvl: "L3", when: "确认", who: "法务", action: "追回、解聘，若需要向监管披露。" },
        { lvl: "L4", when: "项目抛售 vs 锁仓", who: "上币", action: "停牌、标注或下币；按锁仓起诉。" },
        { lvl: "L5", when: "证券型代币 / 重大散户损害", who: "法务", action: "监管 / 执法。" }
      ],
      countermeasures: ["上币知必所需；水印 CRM；访问日志保留 5 年以上。", "员工钱包披露与预批准；自首次商务接触起进限制名单。", "合同锁仓配合场所可监控的链上归属。", "解锁：T-24 小时到 T+24 小时降杠杆、加保证金；流通供给横幅。", "上币后团队钱包提现冷静期。", "代币化上线：与证券 IPO 隔离日志同一套内部人名单。"]
    },
    {
      id: "cex-sandwich", code: "TRN-CEX-09", name: "跨场所抢跑、夹心与充值泄露",
      severity: "high", products: ["tokens", "perps"],
      summary: "关于即将到来的订单、充值或场外手数的信息，被用来在中心化、去中心化或永续上抢先。链上是夹心；中心化所是特权抢跑。",
      why: "内存池公开。中心化路由、场外台与充值扫描本不该公开。两者都在别人的交易上创造抢跑期权。",
      workflow: [
        { n: "01", who: "搜寻者 / 交易台", action: "看见受害者：待处理 DEX 兑换、慢撮合路径上的大中心化单，或打入已知热钱包的大额充值。", tell: "内存池视图、场外台账、充值监测。" },
        { n: "02", who: "搜寻者", action: "在中心化或 DEX 抢先买入，或抬永续。", tell: "领先滞后：其成交比受害者早数毫秒到数分钟。" },
        { n: "03", who: "受害者", action: "成交；价格更差；他们是夹心的肉。", tell: "受害者中间价成交穿过新价格。" },
        { n: "04", who: "搜寻者", action: "卖回给受害者或卖进改善后的盘口。", tell: "往返库存，锁定价差。" },
        { n: "05", who: "特权变体", action: "场所员工或 VIP API 在撮合前看到队列 / 充值。", tell: "只可能靠内部数据——按操守升级。" }
      ],
      participants: [
        { role: "MEV 搜寻者 / 机器人", incentive: "公开内存池在许多地方合法；但对路由上链的场所仍是客户损害问题。" },
        { role: "场外 / 经纪台", incentive: "自营 vs 代理冲突。" },
        { role: "充值观察者", incentive: "中心化热钱包打印是信号。" },
        { role: "特权 VIP / 员工", incentive: "违法 / 违反条款的抢跑。" },
        { role: "受害交易者", incentive: "更差价格，有时强平。" }
      ],
      detection: {
        tools: ["EigenPhi / MEV-Share 风格夹心标签", "场外台账 vs 公司簿时间戳", "充值到成交领先滞后", "API 优先级 / 托管审计", "员工个人账户 vs 队列"],
        parameters: [
          { metric: "场所路由 DEX 流量上的夹心发生率", window: "日", warn: "> 大额兑换 8%", breach: "> 20% 或未提供私有中继", notes: "若你路由上链，你就欠保护。" },
          { metric: "场外手数后公司同侧交易", window: "客户前 0–30 秒", warn: "无记录对冲例外的任何", breach: "重复 + 公司正 markout", notes: "抢跑。" },
          { metric: "热钱包充值 → 中心化主动买", window: "0–120 秒", warn: "簇相关", breach: "与充值观察台同一受益人", notes: "信号泄露。" },
          { metric: "API 时延档 vs 成交质量", window: "周", warn: "同一吃单流量上 VIP markout 远好于散户", breach: "VIP 看见散户路径看不见的盘口/队列", notes: "特权。" }
        ]
      },
      escalation: [
        { lvl: "L0", when: "持续", who: "系统", action: "夹心与领先滞后告警。" },
        { lvl: "L1", when: "日", who: "执行 / 监察", action: "拆分公开 MEV vs 内部泄露。" },
        { lvl: "L2", when: "内部泄露", who: "合规", action: "切断数据路径；保全日志。" },
        { lvl: "L3", when: "场外冲突", who: "法务", action: "仅代理，或知情同意的风险自营。" },
        { lvl: "L4", when: "员工 / VIP", who: "法务 + 人事", action: "封禁、追回。" },
        { lvl: "L5", when: "系统性", who: "董事会", action: "监管；客户救济。" }
      ],
      countermeasures: ["DEX 路由：私有订单流、MEV 保护中继或询价；永远不要对客户大单做天真的公开内存池清扫。", "场外：带时间戳台账，客户完成前公司不得同名交易（或记录无风险自营）。", "若公开热钱包扫描会泄露待处理充值，则延迟或随机化；使用许多充值地址。", "API 行情平等；付费托管必须披露，且不得包含其他客户队列。", "隔离墙：上币、场外与自营永续不得共享实时客户台账。"]
    },
    {
      id: "cex-depeg", code: "TRN-CEX-10", name: "稳定币、包装物与代币化锚定攻击",
      severity: "critical", products: ["tokens", "tokenised", "perps"],
      summary: "协同挤兑、假新闻爆破或薄盘砸盘，把稳定币或包装/代币化资产打离锚定，使永续、借贷与基差账本强平。",
      why: "USDT/USDC/包装 BTC/代币化国债是抵押层。打破锚定，就是猎杀所有把它们当现金的杠杆账本。",
      workflow: [
        { n: "01", who: "攻击者", action: "绘制谁把锚定当抵押做多（借贷、理财、全仓、代币化净值）。", tell: "公开协议统计；交易所理财锁仓；RWA 包装。" },
        { n: "02", who: "攻击者", action: "可选做空永续或买认沽 / 借入代币。", tell: "永续持仓翻转；借币利率跳升。" },
        { n: "03", who: "攻击者", action: "砸薄的中心化盘口或 DEX 池；或播种偿付谣言；或堵塞赎回。", tell: "一个场所先脱锚；社交尖峰。" },
        { n: "04", who: "级联", action: "预言机更新，抵押率破裂，中心化削发滞后，强平以脱锚单位打印。", tell: "错误计价单位的强平。" },
        { n: "05", who: "攻击者", action: "在强迫流量中回补，或等场所停牌重定价。", tell: "空头利润 + 廉价抵押抢夺。" }
      ],
      participants: [
        { role: "锚定攻击者 / 空头", incentive: "衍生品 + 困境抵押。" },
        { role: "发行方 / 包装方", incentive: "必须诚实捍卫或暂停铸造赎回。" },
        { role: "中心化风险", incentive: "数分钟内决定削发与停对。" },
        { role: "出借人 / 理财用户", incentive: "以为自己持有现金。" },
        { role: "谣言作坊", incentive: "放大挤兑。" }
      ],
      detection: {
        tools: ["锚定看板（中心化 + DEX + 一级赎回）", "发行方鉴证 / 储备证明", "借币利率与永续持仓拼接", "社交谣言分类", "该资产在各产品中的抵押份额"],
        parameters: [
          { metric: "锚定 vs 一级可赎回性", window: "1 分钟", warn: "一级仍开时二级 −50 个基点", breach: "−150 个基点或一级关闭 / 延迟", notes: "区分流动性不足与破产。" },
          { metric: "跨场所离散", window: "30 秒", warn: "> 30 个基点", breach: "> 80 个基点——把被砸盘口从估值隔离", notes: "不要让一次砸盘成为指数。" },
          { metric: "保证金权益中的抵押份额", window: "实时", warn: "单一发行方 > 25%", breach: "> 40%", notes: "集中度。" },
          { metric: "谣言 + 流出", window: "1 小时", warn: "社交 z>4 且净提现 > 3σ", breach: "再加内部人先赎回", notes: "挤兑。" },
          { metric: "预言机滞后 vs 中心化中间价", window: "事件", warn: "过时 > 60 秒", breach: "预言机仍 1.00 而中心化 0.97——冻结该单位强平", notes: "错误计价单位。" }
        ]
      },
      escalation: [
        { lvl: "L0", when: "逐笔", who: "系统", action: "锚定告警；把被砸场所从指数隔离。" },
        { lvl: "L1", when: "数分钟", who: "首席风险官 / 市场风险", action: "削发、降杠杆、暂停新增抵押。" },
        { lvl: "L2", when: "一级存疑", who: "托管 + 合规", action: "联系发行方；若你上了铸造赎回对则暂停。" },
        { lvl: "L3", when: "客户账以该单位计", who: "合规", action: "沟通；不要在破碎的美元上强平。" },
        { lvl: "L4", when: "疑似破产", who: "法务 + 董事会", action: "取消现金资格；把保证金换成其他单位。" },
        { lvl: "L5", when: "系统性", who: "董事会", action: "监管、银行伙伴、公开状态页。" }
      ],
      countermeasures: ["给每一种“现金等价”代币削发。零削发是选择，不是事实。", "估值来自可赎回一级 + 若干二级；丢掉被砸盘口。", "在综合价可信之前，暂停以脱锚资产计价的强平。", "发行方剧本：透明赎回队列，禁止沉默设闸。", "跨现货、理财与抵押的单一发行方集中度上限。", "预先起草脱锚客户文案——沉默会放大谣言。"]
    }
  ],
  stack: {
    intro: "为你真正拥有的盘口买工具。带最后一瞥 LP 的 CFD 经纪商不必先上 DEX 夹心追踪。上市代币化国债的加密场所，不能因为 SMARTS 为现金股票而建就免检。下面是具体栈，以及每层应拥有的参数。",
    layers: [
      {
        name: "采集与时钟",
        fit: "两个场所",
        items: [
          "每笔订单、撤单、拒单、成交、报价 ID 与估值的 drop copy——包括最后一瞥持有。",
          "PTP/NTP 时钟同步；撮合偏差目标 < 1 毫秒，行情相对订单 < 5 毫秒。",
          "每次告警的 L3 盘口快照（至少 ±5 秒、100 毫秒分辨率，DMA 更密）。",
          "不可变对象存储（WORM）5–7 年或当地牌照最低年限。"
        ]
      },
      {
        name: "CFD / 外汇 / 期货监察",
        fit: "CFD 经纪商",
        items: [
          "Nasdaq SMARTS 或 Eventus Validus：幌骗、分层、收盘操纵、动量点火。",
          "若处于欧式滥用体制，使用 NICE Actimize MAR 包。",
          "BestX / Tradefeedr / LiquidMetrix：最后一瞥持有、拒单对称、LP 记分卡。",
          "kdb+ / OneTick / QuestDB 做定制回放——你的混合 A/B 簿标记永远不会开箱即在厂商模型里。",
          "若有专业期货 DMA，使用 TT Score。"
        ]
      },
      {
        name: "加密市场滥用",
        fit: "加密交易所",
        items: [
          "Solidus Labs HAL（对倒、幌骗、拉盘）作为起始打分——始终在自有盘口重调阈值。",
          "若希望 CFD 关联公司 + 交易所共用一家厂商，用 Eventus 或 SMARTS Crypto。",
          "Kaiko / Coin Metrics / Amberdata 看质量成交与跨所估值。",
          "Laevitas 或同类仅作资金费与期权背景——永远不要当估值来源。"
        ]
      },
      {
        name: "钱包、发行方与代币化穿透",
        fit: "代币 + 代币化资产",
        items: [
          "Chainalysis、TRM Labs 或 Elliptic：存款聚类、制裁与发行钱包。",
          "Nansen / Arkham 类标签用于吸筹与解锁钱包（当线索，不当证据）。",
          "Chainlink 储备证明加你自己的索引——永远不要看板截图。",
          "若你碰 DEX 路由或预言机，用 Forta / EigenPhi / Flashbots 类追踪。"
        ]
      },
      {
        name: "身份图谱",
        fit: "两者",
        items: [
          "Neo4j 或同类：设备、IP/自治域、Cookie、银行最终受益人、存款地址、IB、员工 UID。",
          "自成交与报撤比必须跑在簇上，而不是登录号。",
          "IB 与做市法律实体得到与散户马甲同一张图谱。"
        ]
      },
      {
        name: "你已经开始的风险引擎",
        fit: "本仓库",
        items: [
          "risk_metrics_monitor.py —— 在 VaR 与 HHI 旁边加入滥用指标（报撤比、拒单对称、持仓份额）。",
          "stress_testing.py —— 连环强平与保险基金跑道。",
          "trader_rights_workflow.py —— 不要给仍在活监察案件中的 UID 加杠杆。",
          "eod_reconciliation.py —— 抓住实时盘口漏掉的对倒与记账断裂。"
        ]
      }
    ]
  },
  escalationHub: {
    intro: "一架梯子，两种味道。时间为 24/7 台的服务水平。若你只做零售时段，第一个失败模式就是周末无人值守的 L0。",
    steps: [
      { lvl: "L0", title: "发现", sla: "实时到 5 分钟", owner: "系统 / 值班风险官", cfd: "告警、快照盘口、标记最后一瞥与 A/B 簿旗标，估值 z 分数突破则暂停自动强平。", crypto: "告警、快照、丢弃偏离指数来源，可选交易对“谨慎”横幅，错误估值上暂停强平。" },
      { lvl: "L1", title: "分诊", sla: "15–30 分钟", owner: "监察分析师", cfd: "新闻/经济过滤、回放、误报打分。若最后一瞥，拉取持有时间包。", crypto: "社交 + 解锁 + 钱包扩展。拆分公开 MEV 与内部泄露。" },
      { lvl: "L2", title: "调查", sla: "同时段到 T+1", owner: "高级监察 + 市场风险", cfd: "关联账户、IB、公司冲突测试、LP 通知草稿。", crypto: "关联 UID + 链上簇、做市合同、上币 CRM 访问。" },
      { lvl: "L3", title: "立案", sla: "T+1 到 T+5", owner: "合规 / 反洗钱官", cfd: "MAR/CFTC/ASIC 风格档案、语音/聊天、最佳执行含义、客户损害估计。", crypto: "条款 + 当地滥用/欺诈档案、发行方函、聚合器成交重述。" },
      { lvl: "L4", title: "遏制", sla: "一旦重大立即", owner: "风险负责人 + 法务 + 产品", cfd: "DMA 熔断、手数上限、关闭最后一瞥、重估、救济。", crypto: "封 API、停对、抵押削发、保险注资、自动减仓审计、锁仓执行。" },
      { lvl: "L5", title: "报告", sla: "按规定——不要等完美档案", owner: "法务 / 反洗钱官 / 董事会", cfd: "场所、FCA/ASIC/MAS/CFTC/其他，若 IB 欺诈则支付伙伴。", crypto: "同上再加链分析可疑报告、发行方监管、脱锚时的银行伙伴。" }
    ],
    comms: [
      "停牌前先写给客户的那一句：你看见了什么、暂停了什么、订单与保证金会怎样。",
      "自营簿与市场部在合规签署该句之前不得发言。",
      "先保全：drop copy、估值、CRM 访问、钱包名单。然后再跟发行方或 LP 谈。",
      "若撤销成交，用已公布政策（偏离市价带宽 + 流程），而不是 VIP 电话。"
    ]
  }
};
