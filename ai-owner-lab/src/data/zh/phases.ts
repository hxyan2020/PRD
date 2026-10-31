import type { Phase } from '../types'

export const phasesZh: Phase[] = [
  {
    id: 'foundations',
    week: 1,
    title: '基础',
    subtitle: '会说行话。搞清 AI 产品到底是什么。',
    days: [1, 2, 3, 4, 5, 6, 7],
    color: 'var(--teal)',
  },
  {
    id: 'architecture',
    week: 2,
    title: '架构与模块',
    subtitle: '画清技术栈。有意图地使用 RAG、智能体与基础设施。',
    days: [8, 9, 10, 11, 12, 13, 14],
    color: 'var(--ink)',
  },
  {
    id: 'ops',
    week: 3,
    title: 'AI DevOps 与生产',
    subtitle: '会维护系统。抑制幻觉。能跑故障。',
    days: [15, 16, 17, 18, 19, 20, 21],
    color: 'var(--amber)',
  },
  {
    id: 'future',
    week: 4,
    title: '未来与结业',
    subtitle: '最新 AI、职业影响、用例与你的 PRD。',
    days: [22, 23, 24, 25, 26, 27, 28, 29, 30],
    color: 'var(--signal)',
  },
]
