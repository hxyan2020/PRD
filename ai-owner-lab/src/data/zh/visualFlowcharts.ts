import { visualFlowcharts as flowchartsEn } from '../visualFlowcharts'
import type { LessonVisual, VisualNode } from '../visualTypes'

type NodeText = { label: string; detail: string; tag?: string }

const zhByDay: Record<number, { title: string; caption: string; nodes: Record<string, NodeText> }> = {
  1: {
    title: '这是 AI 问题吗？',
    caption: '在为模型掏钱前走完决策路径。',
    nodes: {
      f1: { label: '用户任务已定义？', tag: 'start', detail: '用一句话写下要完成的工作。' },
      f2: { label: '需要语言/判断？', tag: 'decision', detail: '若纯 CRUD 或精确计算——优先规则，而非 AI。' },
      f3: { label: '错误预算已达成？', tag: 'decision', detail: '干系人接受错误率与严重度。' },
      f4: { label: '混合设计', tag: 'process', detail: '软步骤用 AI；钱、鉴权、合规用规则。' },
      f5: { label: '带评估上线', tag: 'terminal', detail: '扩规模前先有金标集与恢复路径。' },
    },
  },
  2: {
    title: '选择能力层',
    caption: '把问题路由到最便宜且够用的一层。',
    nodes: {
      f1: { label: '已有结构化标签？', tag: 'start', detail: '历史欺诈/流失标签 → 先经典 ML。' },
      f2: { label: '感知（视觉/语音）？', tag: 'decision', detail: '用深度学习 / 多模态栈。' },
      f3: { label: '语言 + 工具？', tag: 'decision', detail: '带 schema 的 LLM / 生成层。' },
      f4: { label: '需要硬停？', tag: 'decision', detail: '始终用规则与护栏包裹。' },
      f5: { label: '组合各层', tag: 'terminal', detail: '多数产品是规则 → ML → LLM。' },
    },
  },
  3: {
    title: '设定生成策略',
    caption: '温度是产品决策，不是魔法数字。',
    nodes: {
      f1: { label: '任务类型', tag: 'start', detail: '运维问答、助手还是创意？' },
      f2: { label: '需要引用？', tag: 'decision', detail: '是 → 低温 + 有据模式。' },
      f3: { label: '用户直接发布？', tag: 'decision', detail: '是 → 强制人工评审；温度适中。' },
      f4: { label: 'Schema / 工具', tag: 'process', detail: '结构化输出胜过指望格式。' },
      f5: { label: '钉住并评估', tag: 'terminal', detail: '版本化旋钮；在金标集上打分。' },
    },
  },
  4: {
    title: '嵌入检索路径',
    caption: '从查询文本到邻近文档。',
    nodes: {
      f1: { label: '用户查询', tag: 'start', detail: '自然语言意图 + 过滤条件。' },
      f2: { label: '嵌入查询', tag: 'process', detail: '与语料相同的嵌入模型。' },
      f3: { label: '近邻搜索', tag: 'process', detail: '向量检索找到释义匹配。' },
      f4: { label: 'ACL / 元数据 OK？', tag: 'decision', detail: '丢弃用户不可见的片段。' },
      f5: { label: '排序证据', tag: 'terminal', detail: '只把允许且相关的片段往后传。' },
    },
  },
  5: {
    title: '提示组装顺序',
    caption: '顺序错误 → 策略被忽略与注入。',
    nodes: {
      f1: { label: '系统策略', tag: 'start', detail: '宪法：角色、必须/禁止、格式。' },
      f2: { label: '工具与 schema', tag: 'process', detail: '最小权限能力。' },
      f3: { label: '检索证据', tag: 'process', detail: '作为数据分隔，永不作为指令。' },
      f4: { label: '用户消息', tag: 'process', detail: '不可信；警惕注入。' },
      f5: { label: '模型调用', tag: 'terminal', detail: '记录每一层的版本。' },
    },
  },
  6: {
    title: '路由到模型档位',
    caption: '敏感度 × 难度决定花费与评审。',
    nodes: {
      f1: { label: '意图分类', tag: 'start', detail: '先廉价分类器或规则。' },
      f2: { label: '高敏感？', tag: 'decision', detail: '法务/医疗/金融 → 更强护栏。' },
      f3: { label: '难推理？', tag: 'decision', detail: '是 → 更强模型；否则小/便宜。' },
      f4: { label: '施加护栏', tag: 'process', detail: 'Schema、引用、写操作人工批准。' },
      f5: { label: '服务并计量', tag: 'terminal', detail: '跟踪每次成功任务的成本。' },
    },
  },
  7: {
    title: '绿灯门禁序列',
    caption: '任一红灯即停止立项。',
    nodes: {
      f1: { label: '问题契合', tag: 'start', detail: '确认语言/判断瓶颈。' },
      f2: { label: '基线已知？', tag: 'decision', detail: '否 → 先度量宏/搜索/人工。' },
      f3: { label: '错误预算已定？', tag: 'decision', detail: '否 → 与干系人研讨严重度。' },
      f4: { label: '评估方法就绪？', tag: 'decision', detail: '提示折腾前先有金标集。' },
      f5: { label: '资助试点', tag: 'terminal', detail: '有时限与终止标准。' },
    },
  },
  8: {
    title: '请求穿越技术栈',
    caption: '跟随一条用户消息端到端。',
    nodes: {
      f1: { label: '客户端 UX', tag: 'start', detail: '捕获意图；稍后展示信任 UI。' },
      f2: { label: '网关', tag: 'process', detail: '鉴权、租户、预算、PII 清洗。' },
      f3: { label: '编排', tag: 'process', detail: 'RAG、工具、提示组装、路由。' },
      f4: { label: '模型 + 数据', tag: 'process', detail: '从证据存储生成。' },
      f5: { label: '响应 UX', tag: 'terminal', detail: '引用、审批、副作用清晰。' },
    },
  },
  9: {
    title: 'RAG 决策流',
    caption: '何时回答、弃权或升级。',
    nodes: {
      f1: { label: '检索 top-k', tag: 'start', detail: '带 ACL 过滤的混合搜索。' },
      f2: { label: '证据充分？', tag: 'decision', detail: '弱/冲突 → 弃权路径。' },
      f3: { label: '生成并引用', tag: 'process', detail: '只根据段落回答。' },
      f4: { label: '用户信任声明？', tag: 'decision', detail: '提供来源；争议时升级。' },
      f5: { label: '完成 / 工单', tag: 'terminal', detail: '记录未命中供语料待办。' },
    },
  },
  10: {
    title: '两阶段检索',
    caption: '先宽召回，再求精确。',
    nodes: {
      f1: { label: '查询 + 过滤', tag: 'start', detail: '租户、产品、语言约束。' },
      f2: { label: '混合检索', tag: 'process', detail: 'BM25 + 向量兼顾 ID 与释义。' },
      f3: { label: '重排', tag: 'process', detail: '交叉编码器 / LLM 重排器。' },
      f4: { label: '金标在 top-k？', tag: 'decision', detail: '否 → 先修检索再改提示。' },
      f5: { label: '打包上下文', tag: 'terminal', detail: '在 token 预算内装入证据。' },
    },
  },
  11: {
    title: '智能体步进决策',
    caption: '每次循环都需要停止规则。',
    nodes: {
      f1: { label: '规划下一步', tag: 'start', detail: '在最大步数与白名单工具内。' },
      f2: { label: '写操作？', tag: 'decision', detail: '是 → 人工审批门。' },
      f3: { label: '行动 + 观察', tag: 'process', detail: '调工具；读错误/空数据。' },
      f4: { label: '达标 / 卡住？', tag: 'decision', detail: '卡住 → 问用户或停止。' },
      f5: { label: '退出循环', tag: 'terminal', detail: '返回结果并带审计轨迹。' },
    },
  },
  12: {
    title: '按任务选基础设施',
    caption: '把要完成的工作映射到组件。',
    nodes: {
      f1: { label: '需要语义搜索？', tag: 'start', detail: '是 → 向量库 + 混合检索。' },
      f2: { label: '重复查询？', tag: 'decision', detail: '缓存嵌入/答案。' },
      f3: { label: '长/批任务？', tag: 'decision', detail: '队列与 worker，而非请求线程。' },
      f4: { label: '多租户？', tag: 'decision', detail: '网关强制鉴权与预算。' },
      f5: { label: '接通可观测', tag: 'terminal', detail: '每一跳都有链路。' },
    },
  },
  13: {
    title: '晋级前先评估',
    caption: '金标未过 → 不上生产。',
    nodes: {
      f1: { label: '变更就绪', tag: 'start', detail: '提示、模型或索引差值。' },
      f2: { label: '离线门禁通过？', tag: 'decision', detail: '忠实度、召回、安全阈值。' },
      f3: { label: '金丝雀流量', tag: 'process', detail: '小切片对照。' },
      f4: { label: '在线 OK？', tag: 'decision', detail: '点赞、升级、成本、延迟。' },
      f5: { label: '晋级或回滚', tag: 'terminal', detail: '钉版本；提失败工单。' },
    },
  },
  14: {
    title: '故障排障路径',
    caption: '最后才怪模型。',
    nodes: {
      f1: { label: '复现 + 链路', tag: 'start', detail: '输入、版本、请求 ID。' },
      f2: { label: '证据存在？', tag: 'decision', detail: '缺金标文档 → 检索 bug。' },
      f3: { label: '工具健康？', tag: 'decision', detail: '超时/空结果 → 工具或 schema bug。' },
      f4: { label: '提示组装', tag: 'process', detail: '截断、顺序、冲突。' },
      f5: { label: '模型 / 护栏', tag: 'terminal', detail: '然后才考虑路由或过滤器。' },
    },
  },
  15: {
    title: 'LLMOps 晋级路径',
    caption: '原型 → 带回滚钉的运营。',
    nodes: {
      f1: { label: '原型', tag: 'start', detail: '仅沙箱数据。' },
      f2: { label: '评估差值 OK？', tag: 'decision', detail: '在金标上击败基线。' },
      f3: { label: '硬化', tag: 'process', detail: '护栏、鉴权、成本上限、引用。' },
      f4: { label: '金丝雀', tag: 'process', detail: '百分比流量 + 看板。' },
      f5: { label: '运营', tag: 'terminal', detail: '维护语料/Skills；退役死路径。' },
    },
  },
  16: {
    title: '拦住幻觉',
    caption: '层层防御直到声明安全。',
    nodes: {
      f1: { label: '声明已生成', tag: 'start', detail: '模型产出事实断言。' },
      f2: { label: 'RAG 有据？', tag: 'decision', detail: '无证据 → 弃权。' },
      f3: { label: '确定性校验', tag: 'process', detail: '在模型外校验 ID、金额、日期。' },
      f4: { label: '高风险？', tag: 'decision', detail: '是 → 发送前人工在环。' },
      f5: { label: '放出答案', tag: 'terminal', detail: '展示引用；记入评估。' },
    },
  },
  17: {
    title: '选择信任 UX 状态',
    caption: '用户需要明确的已验证 vs 不确定路径。',
    nodes: {
      f1: { label: '证据质量', tag: 'start', detail: '为检索 + 工具核验打分。' },
      f2: { label: '完全核验？', tag: 'decision', detail: '有引用或工具支持的字段。' },
      f3: { label: '展示有据答案', tag: 'process', detail: '段落链接；声明 ↔ 证据。' },
      f4: { label: '草稿或弃权', tag: 'process', detail: '座席辅助或「我不知道」+ 升级。' },
      f5: { label: '用户下一步', tag: 'terminal', detail: '永不伪造自信。' },
    },
  },
  18: {
    title: '看板分诊',
    caption: '哪一个健康平面着火了？',
    nodes: {
      f1: { label: '告警触发', tag: 'start', detail: '带着上下文呼叫正确负责人。' },
      f2: { label: '错误 / 超时？', tag: 'decision', detail: '可靠性平面 → 供应商/故障转移。' },
      f3: { label: '延迟飙升？', tag: 'decision', detail: '性能 → 工具、检索、首包。' },
      f4: { label: '成本或质量？', tag: 'decision', detail: '经济 vs 信任指标分叉。' },
      f5: { label: '有主行动', tag: 'terminal', detail: '工单含平面 + SLO 影响。' },
    },
  },
  19: {
    title: '故障响应',
    caption: '先遏制，再聪明地排障。',
    nodes: {
      f1: { label: '发现', tag: 'start', detail: '质量/成本/安全回归告警。' },
      f2: { label: '遏制', tag: 'process', detail: '关开关、强制拒答、钉住上一好版本。' },
      f3: { label: '沟通', tag: 'process', detail: '告诉支持用户会看到什么。' },
      f4: { label: '诊断', tag: 'process', detail: '链路 → 检索/工具/提示/模型。' },
      f5: { label: '修复 + 复盘', tag: 'terminal', detail: '评估回归 + 预防负责人。' },
    },
  },
  20: {
    title: '数据出境检查',
    caption: '什么可以离开信任边界？',
    nodes: {
      f1: { label: '数据分类', tag: 'start', detail: '公开 / 内部 / 敏感。' },
      f2: { label: '需要模型供应商？', tag: 'decision', detail: '清洗 PII；知晓留存条款。' },
      f3: { label: '需要公网？', tag: 'decision', detail: '仅白名单研究工具。' },
      f4: { label: '安全记日志', tag: 'process', detail: '遮蔽提示/链路；设留存。' },
      f5: { label: '审计轨迹', tag: 'terminal', detail: '谁经何工具看到了什么。' },
    },
  },
  21: {
    title: '维护分诊',
    caption: '腐烂表现为质量债——排进日历。',
    nodes: {
      f1: { label: '信号出现', tag: 'start', detail: '评估下滑、陈旧文档、坏 Skill。' },
      f2: { label: '安全 / Sev？', tag: 'decision', detail: '每日告警路径 vs 待办。' },
      f3: { label: '语料还是 Skill？', tag: 'decision', detail: '不同负责人与时钟。' },
      f4: { label: '安排修复', tag: 'process', detail: '每周/每月卫生时段。' },
      f5: { label: '再评估', tag: 'terminal', detail: '在金标上证明修复。' },
    },
  },
  22: {
    title: '雷达落位',
    caption: '采纳、试点、观察或忽略——选一个。',
    nodes: {
      f1: { label: '新 AI 主张', tag: 'start', detail: '供应商炒作或论文。' },
      f2: { label: '有指标？', tag: 'decision', detail: '无指标 → 仅忽略或观察。' },
      f3: { label: '契合路线图？', tag: 'decision', detail: '是且已验证 → 采纳；否则试点。' },
      f4: { label: '时限试点', tag: 'process', detail: '终止标准与评估计划。' },
      f5: { label: '更新雷达', tag: 'terminal', detail: '每季发布备忘。' },
    },
  },
  23: {
    title: '谁拥有决策？',
    caption: '产品 · 工程 · 领域运营三角。',
    nodes: {
      f1: { label: '决策类型', tag: 'start', detail: 'UX 指标、模型，还是语料真相？' },
      f2: { label: '用户 / 错误预算？', tag: 'decision', detail: '产品与干系人主导。' },
      f3: { label: '系统怎么做？', tag: 'decision', detail: '工程/科学拥有编排与基础设施。' },
      f4: { label: '政策真相？', tag: 'decision', detail: '领域运营拥有语料与升级。' },
      f5: { label: 'RACI 已记录', tag: 'terminal', detail: '故障中无孤儿决策。' },
    },
  },
  24: {
    title: '技能 → 工件循环',
    caption: '有证据的练习才算数。',
    nodes: {
      f1: { label: '选技能缺口', tag: 'start', detail: '自评 1–5；选两项。' },
      f2: { label: '交付小工件', tag: 'process', detail: 'PRD 切片、记分卡或复盘。' },
      f3: { label: '获得评审？', tag: 'decision', detail: '同事或干系人反馈。' },
      f4: { label: '收入作品集', tag: 'process', detail: '带日期与教训的索引。' },
      f5: { label: '提高分数', tag: 'terminal', detail: '每月重复。' },
    },
  },
  25: {
    title: '客服自动化阶梯',
    caption: '仅在指标允许时升级档位。',
    nodes: {
      f1: { label: '意图到达', tag: 'start', detail: '分类：FAQ、辅助或自动化。' },
      f2: { label: '可自助？', tag: 'decision', detail: '有据 RAG + 易升级。' },
      f3: { label: '需人工语气？', tag: 'decision', detail: '座席辅助草稿；人发送。' },
      f4: { label: '工具 + 确认', tag: 'process', detail: '仅有界自动化。' },
      f5: { label: '度量 CSAT', tag: 'terminal', detail: '遏制率不得毁掉信任。' },
    },
  },
  26: {
    title: '内部副驾驶答题路径',
    caption: '权限先于聪明。',
    nodes: {
      f1: { label: '提问', tag: 'start', detail: '员工在领域岛内提问。' },
      f2: { label: 'ACL 允许文档？', tag: 'decision', detail: '无权限绝不跨团队。' },
      f3: { label: '来源层级', tag: 'process', detail: '政策 wiki 胜过随机 Slack。' },
      f4: { label: '冲突 / 缺失？', tag: 'decision', detail: '问负责人；不编造。' },
      f5: { label: '有据答案', tag: 'terminal', detail: '跟踪答疑时延与纠正率。' },
    },
  },
  27: {
    title: '智能体写门禁',
    caption: '自由提议；谨慎执行。',
    nodes: {
      f1: { label: '智能体提议动作', tag: 'start', detail: '展示计划与工具参数。' },
      f2: { label: '只读？', tag: 'decision', detail: '在 ACL 下允许；记录访问。' },
      f3: { label: '高影响写？', tag: 'decision', detail: '变更 CRM/基础设施 → 明确批准。' },
      f4: { label: '执行 + 审计', tag: 'process', detail: '幂等写入；完整轨迹。' },
      f5: { label: '向用户确认', tag: 'terminal', detail: '改了什么、如何撤销。' },
    },
  },
  28: {
    title: '自建 / 外购 / 合作',
    caption: '无差异管道 vs 你的护城河。',
    nodes: {
      f1: { label: '能力需求', tag: 'start', detail: '网关、工作流还是专用模型？' },
      f2: { label: '商品化？', tag: 'decision', detail: '是 → 带退出条款外购。' },
      f3: { label: '差异化？', tag: 'decision', detail: '工作流 + 评估 + UX → 自建。' },
      f4: { label: '利基速度胜？', tag: 'decision', detail: '自建更慢时合作。' },
      f5: { label: '合同清单', tag: 'terminal', detail: '导出、删除、评估访问、价格逃生。' },
    },
  },
  29: {
    title: 'AI PRD 写作路径',
    caption: '从问题到上线的结业脊柱。',
    nodes: {
      f1: { label: '问题与用户', tag: 'start', detail: '要完成的工作与非目标。' },
      f2: { label: '模块', tag: 'process', detail: 'RAG/智能体/工具/信任 UX 状态。' },
      f3: { label: '评估门禁', tag: 'process', detail: '阻断发布的离线阈值。' },
      f4: { label: '运维附件', tag: 'process', detail: '监控、on-call、回滚、RACI。' },
      f5: { label: '上线计划', tag: 'terminal', detail: '金丝雀 + 终止标准。' },
    },
  },
  30: {
    title: '结业后节奏',
    caption: '第 30 天之后，操作系统就是产品。',
    nodes: {
      f1: { label: '每周质量', tag: 'start', detail: '失败 → 检索/提示/UX 工单。' },
      f2: { label: '每月对比', tag: 'process', detail: '一份备忘：模型/提示/索引差值。' },
      f3: { label: '每季雷达', tag: 'process', detail: '采纳 / 试点 / 观察 / 忽略。' },
      f4: { label: '该复讲？', tag: 'decision', detail: '向干系人讲清技术栈。' },
      f5: { label: '持续交付', tag: 'terminal', detail: '工件胜过结业证书。' },
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

export const visualFlowchartsZh: LessonVisual[] = flowchartsEn.map((v) => {
  const z = zhByDay[v.day]
  if (!z) return v
  return {
    ...v,
    title: z.title,
    caption: z.caption,
    nodes: mapNodes(v.nodes, z.nodes),
  }
})
