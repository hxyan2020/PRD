import type { Phase } from './types'

export const phases: Phase[] = [
  {
    id: 'foundations',
    week: 1,
    title: 'Foundations',
    subtitle: 'Speak the language. Know what AI products actually are.',
    days: [1, 2, 3, 4, 5, 6, 7],
    color: 'var(--teal)',
  },
  {
    id: 'architecture',
    week: 2,
    title: 'Architecture & Modules',
    subtitle: 'Map the stack. Use RAG, agents, and infra with intent.',
    days: [8, 9, 10, 11, 12, 13, 14],
    color: 'var(--ink)',
  },
  {
    id: 'ops',
    week: 3,
    title: 'AI DevOps & Production',
    subtitle: 'Maintain systems. Stop hallucinations. Run incidents.',
    days: [15, 16, 17, 18, 19, 20, 21],
    color: 'var(--amber)',
  },
  {
    id: 'future',
    week: 4,
    title: 'Future & Career Capstone',
    subtitle: 'Latest AI, career impact, use cases, and your PRD.',
    days: [22, 23, 24, 25, 26, 27, 28, 29, 30],
    color: 'var(--signal)',
  },
]
