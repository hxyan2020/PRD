import { visuals as visualsEn } from '../visuals'
import type { LessonVisual, VisualNode } from '../visualTypes'

type NodeText = { label: string; detail: string; tag?: string }

const zhByDay: Record<
  number,
  {
    title: string
    caption: string
    nodes?: Record<string, NodeText>
    leftTitle?: string
    rightTitle?: string
    left?: Record<string, NodeText>
    right?: Record<string, NodeText>
    buckets?: { title: string; items: string[] }[]
    rows?: { label: string; children: Record<string, NodeText> }[]
    xLabels?: [string, string]
    yLabels?: [string, string]
    cells?: Record<string, NodeText>
    slider?: {
      label: string
      bands: { max: number; label: string; detail: string }[]
    }
  }
> = {
  1: {
    title: '规则 vs 概率 vs 混合',
    caption: '点选每种产品形态。AI 产品通常活在混合区。',
    leftTitle: '确定性软件',
    rightTitle: '概率性 AI',
    left: {
      d1: { label: '同输入 → 同输出', detail: '结账合计与权限检查必须每次精确。' },
      d2: { label: '大声失败', detail: '异常与 500 优于静默错误。' },
      d3: { label: '测试 = 精确断言', detail: '单元测试用固定夹具证明正确性。' },
    },
    right: {
      p1: { label: '同输入 → 分布', detail: '摘要与推荐会变化；你设计可接受方差。' },
      p2: { label: '温和失败', detail: '错但流畅的答案在被信任前看起来没事。' },
      p3: { label: '测试 = 评估 + 错误预算', detail: '度量坏答案比率，不只“函数返回 200”。' },
    },
  },
  2: {
    title: '能力地图',
    caption: '点击一层，看 PO 何时该用它。',
    nodes: {
      gen: { label: '生成式 AI / LLM', tag: '语言与工具', detail: '瓶颈是语言、综合或灵活工具调用时使用。' },
      dl: { label: '深度学习', tag: '感知', detail: '视觉、语音、复杂信号——常包在多模态 LLM 下。' },
      ml: { label: '经典 ML', tag: '结构化', detail: '欺诈分、流失、需求预测——往往更便宜可控。' },
      rules: { label: '规则与启发式', tag: '护栏', detail: '权限、合规硬停与确定性检查仍需要。' },
    },
  },
  3: {
    title: '温度作为产品旋钮',
    caption: '拖动温度，看产品姿态如何变化。',
    slider: {
      label: '温度',
      bands: [
        { max: 0.2, label: '有据运维模式', detail: '客服、政策问答、RAG——偏好低方差与引用。' },
        { max: 0.5, label: '平衡助手', detail: '通用副驾驶：有灵活度，仍受 schema 与检索约束。' },
        { max: 1, label: '创意模式', detail: '头脑风暴与创意草稿——发布前保留人工评审。' },
      ],
    },
  },
  4: {
    title: '意义即邻近向量',
    caption: '点击查询，看哪些文档在嵌入空间“靠近”。',
    nodes: {
      q1: { label: '“登不进去”', tag: '查询', detail: '靠近：重置密码、SSO 故障、账户锁定——即使关键词不同。' },
      q2: { label: '“发票差异”', tag: '查询', detail: '靠近：计费 FAQ、贷项流程——远离营销博客。' },
      d1: { label: '重置密码 runbook', tag: '文档', detail: '登录失败应检索到；ACL 仍适用。' },
      d2: { label: '品牌活动简报', tag: '文档', detail: '语义上远离计费/登录——若排名高，语料/过滤有问题。' },
    },
  },
  5: {
    title: '提示分层即产品宪法',
    caption: '检查每层指令——冲突会制造“无视策略”bug。',
    nodes: {
      sys: { label: '系统提示', tag: '策略', detail: '角色、必须/禁止、拒答、格式——像代码一样版本化。' },
      tools: { label: '工具与 schema', tag: '能力', detail: '模型能调用什么；写操作最小权限。' },
      rag: { label: '检索证据', tag: '事实', detail: '上下文中的文档；永不把文档当特权指令。' },
      user: { label: '用户消息', tag: '请求', detail: '不可信输入——分隔并防注入。' },
    },
  },
  6: {
    title: '模型路由矩阵',
    caption: '点击象限选择模型档位策略。',
    xLabels: ['低敏感', '高敏感'],
    yLabels: ['难任务', '易任务'],
    cells: {
      m1: { label: '强模型 + 评审', detail: '复杂+敏感：前沿模型、引用、写操作人工批准。' },
      m2: { label: '强模型 + 护栏', detail: '复杂+较低敏感：强模型、schema 校验、评估门禁。' },
      m3: { label: '小/便宜模型', detail: '易+低敏感：分类、路由、短回复草稿。' },
      m4: { label: '小模型 + 硬规则', detail: '易+敏感：优先确定性检查；AI 仅辅助。' },
    },
  },
  7: {
    title: 'AI 绿灯清单',
    caption: '点击每道门——立项前应全绿。',
    nodes: {
      g1: { label: '问题契合', detail: '语言/判断瓶颈或有标注的模式问题——不是纯 CRUD。' },
      g2: { label: '基线', detail: '知道要打败的非 AI 基线（搜索、宏、人工）。' },
      g3: { label: '错误预算', detail: '与干系人定义可接受错误与严重度分类。' },
      g4: { label: '评估方法', detail: '改提示前已有金标集+量表。' },
      g5: { label: '恢复路径', detail: '用户可撤销、升级或核实来源。' },
    },
  },
  8: {
    title: 'AI 应用技术栈',
    caption: '点击一层，看它拥有什么——以及如何失败。',
    nodes: {
      client: { label: '客户端 / UX', tag: '信任', detail: '展示引用、审批、流式；永不隐藏副作用。' },
      gateway: { label: 'API 网关', tag: '控制', detail: '鉴权、租户、限流、PII 脱敏、预算。' },
      orch: { label: '编排', tag: '大脑', detail: '提示组装、RAG、工具、路由——多数“模型 bug”在此。' },
      model: { label: '模型厂商', tag: '生成', detail: '产生文本/动作；不拥有真理。' },
      data: { label: '数据存储', tag: '真理', detail: '向量索引、SQL、对象存储——权限在此强制。' },
    },
  },
  9: {
    title: 'RAG 模块图',
    caption: '从语料到带引用答案走一遍。',
    nodes: {
      r1: { label: '摄入', detail: '连接器拉取来源；跟踪新鲜度与 ACL。' },
      r2: { label: '切片', detail: '按结构切分；大小/重叠匹配问题类型。' },
      r3: { label: '嵌入 + 索引', detail: '向量 + 租户/日期/类型元数据过滤。' },
      r4: { label: '检索', detail: '混合搜索 + top-k；先最大化召回。' },
      r5: { label: '生成 + 引用', detail: '凭证据回答否则弃权；链接段落。' },
    },
  },
  10: {
    title: '先检索再重排',
    caption: '两阶段检索：先召回，后精度。',
    nodes: {
      t1: { label: '查询', detail: '用户问题 + 过滤（租户、产品、语言）。' },
      t2: { label: '混合检索', detail: 'BM25 + 向量同时抓住 ID 与改写。' },
      t3: { label: '重排 top-k', detail: '交叉编码器或 LLM 重排提升精度。' },
      t4: { label: '上下文打包', detail: '在 token 预算内装证据，不截断策略。' },
      t5: { label: '回答', detail: '金标不在 top-k 就修检索——别改语气。' },
    },
  },
  11: {
    title: '智能体控制环',
    caption: '点击计划→行动→观察循环中的阶段。',
    nodes: {
      a1: { label: '计划', detail: '在最大步数与白名单工具内决定下一步。' },
      a2: { label: '行动', detail: '调用工具/Skill；写操作需审批门。' },
      a3: { label: '观察', detail: '读工具结果；发现错误与空数据。' },
      a4: { label: '决策', detail: '继续、问用户或停止——永不无限循环。' },
    },
  },
  12: {
    title: '基础设施 jobs-to-be-done',
    caption: '把每个组件对上它真正做的工作。',
    nodes: {
      i1: { label: '向量库', tag: '检索', detail: 'RAG 的近邻 + 元数据过滤。' },
      i2: { label: '缓存', tag: '成本', detail: '为重复查询复用嵌入/答案。' },
      i3: { label: '队列/工人', tag: '异步', detail: '超出请求超时的摄入、长智能体、批量评估。' },
      i4: { label: '网关', tag: '安全', detail: '鉴权、路由、预算、租户强制。' },
      i5: { label: '对象 + SQL', tag: '来源', detail: '原文件与事务真理系统。' },
    },
  },
  13: {
    title: '能上线的评估环',
    caption: '在线学习前先离线门禁——点击各阶段。',
    nodes: {
      e1: { label: '金标集', detail: '带期望文档/答案/拒答的标注问题。' },
      e2: { label: '离线打分', detail: '忠实度、检索召回、schema 合法性、安全。' },
      e3: { label: '金丝雀', detail: '小流量切片 vs 对照看质量/成本/延迟。' },
      e4: { label: '在线信号', detail: '点赞、编辑、升级、任务完成。' },
      e5: { label: '待办', detail: '失败变成检索、提示或 UX 工单。' },
    },
  },
  14: {
    title: '排障树',
    caption: '从顶层开始——多数故障在“怪模型”前解决。',
    rows: [
      { label: '1. 复现', children: { db1: { label: '输入 + 链路 ID', detail: '改任何东西前先抓意图、版本、请求 id。' } } },
      {
        label: '2. 证据路径',
        children: {
          db2: { label: '检索块', detail: '金标在 top-k 吗？检索错→答案错。' },
          db3: { label: '工具调用', detail: '超时、空结果、错误参数。' },
        },
      },
      { label: '3. 组装', children: { db4: { label: '最终提示', detail: '截断、指令顺序、冲突策略。' } } },
      {
        label: '4. 输出',
        children: {
          db5: { label: '模型文本', detail: '现在才考虑模型质量/路由。' },
          db6: { label: '护栏', detail: '后置过滤是否拦截、改写或漏掉坏主张？' },
        },
      },
    ],
  },
  15: {
    title: 'LLMOps 生命周期',
    caption: '提示、索引与模型的晋级路径。',
    nodes: {
      l1: { label: '原型', detail: '合成/脱敏数据沙箱。' },
      l2: { label: '评估', detail: '相对基线的金标差值。' },
      l3: { label: '加固', detail: '护栏、鉴权、成本上限、引用。' },
      l4: { label: '金丝雀', detail: '百分比流量 + 回滚钉。' },
      l5: { label: '运营', detail: '监控、维护语料/Skills、退役死路径。' },
    },
  },
  16: {
    title: '幻觉防控栈',
    caption: '层层控制——点击每道防线。',
    nodes: {
      h1: { label: '人在回路', tag: '高风险', detail: '不可逆或受监管动作的审批。' },
      h2: { label: '确定性检查', tag: '核实', detail: 'ID、金额、日期在模型外校验。' },
      h3: { label: '引用 + 弃权', tag: 'UX', detail: '展示来源；证据弱则拒答。' },
      h4: { label: '有据 RAG', tag: '上下文', detail: '只根据检索证据回答。' },
      h5: { label: '低温 + schema', tag: '生成', detail: '减少创意漂移；强制结构化输出。' },
    },
  },
  17: {
    title: '信任 UX 状态',
    caption: '设计用户可信的三种明确答案状态。',
    leftTitle: '已核实路径',
    rightTitle: '不确定路径',
    left: {
      v1: { label: '带引用答案', detail: '段落级链接；主张有证据支持。' },
      v2: { label: '工具核实字段', detail: '订单状态来自 CRM，不是自由文本编造。' },
    },
    right: {
      u1: { label: '弃权 / 拒答', detail: '“我没有证据”+ 下一步（升级、改问）。' },
      u2: { label: '起草给人', detail: '坐席辅助模式：人发送最终消息。' },
    },
  },
  18: {
    title: '四个健康平面',
    caption: '缺一不可的看板。',
    nodes: {
      hp1: { label: '可靠性', tag: '可用性', detail: '错误、超时、厂商故障转移。' },
      hp2: { label: '性能', tag: '延迟', detail: '端到端 p95、工具等待、首 token。' },
      hp3: { label: '经济', tag: '成本', detail: '按成功任务计 token 与美元，不是按消息。' },
      hp4: { label: '质量', tag: '信任', detail: '评估分、点赞、升级、故障率。' },
    },
  },
  19: {
    title: '故障响应流',
    caption: '先遏制——再诊断。',
    nodes: {
      inc1: { label: '发现', detail: '质量/成本/安全回归告警。' },
      inc2: { label: '遏制', detail: '关功能开关、强制拒答、钉上一组良好版本。' },
      inc3: { label: '沟通', detail: '告诉支持/状态页干系人用户会看到什么。' },
      inc4: { label: '诊断', detail: '链路 → 检索/工具/提示/模型。' },
      inc5: { label: '修复 + 复盘', detail: '评估回归 + 有主人的预防动作。' },
    },
  },
  20: {
    title: '数据暴露边界',
    caption: '什么可以离开信任边界？',
    nodes: {
      s1: { label: '用户 + 操作员访问', tag: '内层', detail: '最小权限；审计工具写入。' },
      s2: { label: '你的 VPC / 日志', tag: '平台', detail: '提示/链路脱敏；留存限制。' },
      s3: { label: '模型厂商', tag: '出站', detail: '了解训练/留存条款；需要时用私有终点。' },
      s4: { label: '公共网络', tag: '外层', detail: '仅经带策略的白名单研究工具。' },
    },
  },
  21: {
    title: '维护节奏',
    caption: '活着的 AI 资产需要日历——点击一种节奏。',
    nodes: {
      c1: { label: '每日', tag: '告警', detail: '安全/质量告警 + 抽样链路评审。' },
      c2: { label: '每周', tag: '质量', detail: '金标抽检；顶级失败主题 → 待办。' },
      c3: { label: '每月', tag: '卫生', detail: '语料覆盖、Skill 审计、连接器健康。' },
      c4: { label: '每季', tag: '策略', detail: '模型对比、架构债、build/buy 复盘。' },
    },
  },
  22: {
    title: '个人 AI 雷达',
    caption: '把噪音与路线图信号分开。',
    buckets: [
      { title: '采纳', items: ['评估工具链', '提示词注册表', '混合检索', '引用 UX'] },
      { title: '试点', items: ['有界智能体', '模型路由', 'Skill 包'] },
      { title: '观察', items: ['计算机使用智能体', '端侧 SLM', '多模态客服'] },
      { title: '忽略', items: ['榜单剧场', '无指标的 AGI 炒作'] },
    ],
  },
  23: {
    title: 'AI 产品三角',
    caption: '所有权跨三个席位——点击每一个。',
    nodes: {
      tr1: { label: '产品', detail: '问题、UX、指标、错误预算、叙事。' },
      tr2: { label: '工程 / 科学', detail: '编排、模型、基础设施、评估自动化。' },
      tr3: { label: '领域运营', detail: '语料真理、政策、人工升级质量。' },
    },
  },
  24: {
    title: '技能 → 工件',
    caption: '证明胜过口号——检查每种工件类型。',
    nodes: {
      sk1: { label: 'AI PRD', detail: '问题、模块、评估门禁、回滚。' },
      sk2: { label: '架构一页纸', detail: '层、负责人、失败模式。' },
      sk3: { label: '金标样本', detail: '证明你能量化质量。' },
      sk4: { label: '故障笔记', detail: '遏制 + 预防，不是甩锅。' },
      sk5: { label: '对比备忘', detail: '用数据选择模型/提示。' },
    },
  },
  25: {
    title: '客服 AI 分层',
    caption: '小心攀爬自动化梯子。',
    nodes: {
      su1: { label: '有界自动化', tag: '第 3 层', detail: '经工具+确认的重置密码/订单状态。' },
      su2: { label: '坐席辅助', tag: '第 2 层', detail: '为人起草回复；人发送。' },
      su3: { label: '自助 RAG', tag: '第 1 层', detail: '帮助中心带引用答案；易升级。' },
    },
  },
  26: {
    title: '内部副驾驶真理路径',
    caption: '权限与来源层级就是产品。',
    nodes: {
      ic1: { label: '有主人的语料', detail: '一个有清晰文档主人的领域岛。' },
      ic2: { label: 'ACL 过滤', detail: '无权绝不跨团队检索。' },
      ic3: { label: '来源层级', detail: '政策 wiki 胜过随机 Slack 传说。' },
      ic4: { label: '带引用答案', detail: '应答时延 + 纠正率作指标。' },
      ic5: { label: '问负责人', detail: '证据冲突或缺失时升级。' },
    },
  },
  27: {
    title: '智能体权限平面',
    caption: '把提议与执行分开。',
    leftTitle: '始终允许（读）',
    rightTitle: '需门禁（写）',
    left: {
      ap1: { label: '搜索 / 检索', detail: '带 ACL 的只读知识访问。' },
      ap2: { label: '指标查询', detail: '观察系统而不改变它们。' },
    },
    right: {
      ap3: { label: '创建工单', detail: '展示计划；高影响时确认后创建。' },
      ap4: { label: '变更 CRM / 基础设施', detail: '显式审批、审计轨迹、幂等。' },
    },
  },
  28: {
    title: '自建 / 采购 / 合作',
    caption: '点击策略车道：无差异 vs 护城河工作。',
    nodes: {
      bb1: { label: '采购管道', tag: '买', detail: '网关、可观测、商品化模型访问。' },
      bb2: { label: '自建工作流 + 评估', tag: '建', detail: '领域 Skills、金标、信任 UX——你的差异化。' },
      bb3: { label: '合作专长', tag: '合作', detail: '速度胜过所有权时的小众模型/数据。' },
      bb4: { label: '退出条款', tag: '合同', detail: '导出、删除、评估访问、涨价逃生。' },
    },
  },
  29: {
    title: 'AI PRD 脊柱',
    caption: '每个结业 PRD 都应打中这些节拍。',
    nodes: {
      pr1: { label: '问题与用户', detail: '待办任务与非目标。' },
      pr2: { label: '模块', detail: 'RAG/智能体/工具/UX 信任状态。' },
      pr3: { label: '评估门禁', detail: '阻断发布的离线阈值。' },
      pr4: { label: '运维附件', detail: '监控、on-call、回滚钉、RACI。' },
      pr5: { label: '发布', detail: '金丝雀计划与杀伤标准。' },
    },
  },
  30: {
    title: '毕业操作系统',
    caption: '第 30 天之后，节奏就是产品。',
    nodes: {
      os1: { label: '每周质量', detail: '复盘失败；提检索/提示/UX 工单。' },
      os2: { label: '每月对比', detail: '一份备忘：模型/提示/索引差值。' },
      os3: { label: '每季策略', detail: '刷新采纳 / 试点 / 观察 / 忽略。' },
      os4: { label: '复讲', detail: '向干系人讲清技术栈——流利度证明。' },
    },
  },
}

function mapNodes(nodes: VisualNode[] | undefined, dict?: Record<string, NodeText>) {
  if (!nodes) return nodes
  return nodes.map((n) => {
    const t = dict?.[n.id]
    return t ? { ...n, label: t.label, detail: t.detail, tag: t.tag ?? n.tag } : n
  })
}

export const visualsZh: LessonVisual[] = visualsEn.map((v) => {
  const z = zhByDay[v.day]
  if (!z) return v
  return {
    ...v,
    title: z.title,
    caption: z.caption,
    leftTitle: z.leftTitle ?? v.leftTitle,
    rightTitle: z.rightTitle ?? v.rightTitle,
    xLabels: z.xLabels ?? v.xLabels,
    yLabels: z.yLabels ?? v.yLabels,
    nodes: mapNodes(v.nodes, z.nodes),
    left: mapNodes(v.left, z.left),
    right: mapNodes(v.right, z.right),
    cells: v.cells
      ? (v.cells.map((c) => {
          const t = z.cells?.[c.id]
          return t ? { ...c, label: t.label, detail: t.detail } : c
        }) as LessonVisual['cells'])
      : v.cells,
    buckets: z.buckets ?? v.buckets,
    rows: v.rows?.map((row, idx) => {
      const zr = z.rows?.[idx]
      return {
        label: zr?.label ?? row.label,
        children: mapNodes(row.children, zr?.children) ?? row.children,
      }
    }),
    slider: v.slider
      ? {
          ...v.slider,
          label: z.slider?.label ?? v.slider.label,
          bands: z.slider?.bands ?? v.slider.bands,
        }
      : v.slider,
  }
})
