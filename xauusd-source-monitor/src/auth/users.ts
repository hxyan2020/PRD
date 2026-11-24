export type UserRole = 'admin' | 'risk_ops' | 'analyst'

export interface DemoUser {
  email: string
  password: string
  name: string
  role: UserRole
}

/** Sole content admin — only this person may change Skills, Knowledge, and memory. */
export const CONTENT_ADMIN = {
  name: 'Yan Haixiang',
  /** Primary Hytech identity. */
  email: 'haixiang.yan@hytech.com',
  /** Demo alias kept for existing login hints / seeded sessions. */
  aliasEmails: ['admin@hytech.com'] as const,
} as const

const CONTENT_ADMIN_EMAILS = new Set<string>([
  CONTENT_ADMIN.email,
  ...CONTENT_ADMIN.aliasEmails,
])

/** Seeded demo accounts for the Vercel SPA (browser localStorage auth). */
export const DEMO_USERS: DemoUser[] = [
  {
    email: 'ops@hytech.com',
    password: 'OpsDemo2026!',
    name: 'Risk Ops',
    role: 'risk_ops',
  },
  {
    email: 'risk.ops@hytech.com',
    password: 'RiskDemo2026!',
    name: 'Risk Ops',
    role: 'risk_ops',
  },
  {
    email: 'analyst@hytech.com',
    password: 'RiskDemo2026!',
    name: 'Risk Analyst',
    role: 'analyst',
  },
  {
    email: CONTENT_ADMIN.email,
    password: 'AdminDemo2026!',
    name: CONTENT_ADMIN.name,
    role: 'admin',
  },
  {
    email: 'admin@hytech.com',
    password: 'AdminDemo2026!',
    name: CONTENT_ADMIN.name,
    role: 'admin',
  },
]

/** Hytech org emails used across V Exchange tooling. */
export function isHytechEmail(email: string): boolean {
  const e = email.trim().toLowerCase()
  return /@(hytech\.com|hytechc\.com|hytechpro\.com)$/i.test(e)
}

export function isContentAdminEmail(email: string): boolean {
  return CONTENT_ADMIN_EMAILS.has(email.trim().toLowerCase())
}

/** True only for Yan Haixiang (admin role + allowlisted email). */
export function canEditContentMemory(user: {
  email: string
  role: UserRole
} | null): boolean {
  if (!user) return false
  return user.role === 'admin' && isContentAdminEmail(user.email)
}

export function authenticate(email: string, password: string): DemoUser | null {
  const e = email.trim().toLowerCase()
  if (!isHytechEmail(e)) return null
  const user = DEMO_USERS.find((u) => u.email.toLowerCase() === e)
  if (!user || user.password !== password) return null
  return user
}
