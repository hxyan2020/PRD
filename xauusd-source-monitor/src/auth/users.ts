export type UserRole = 'admin' | 'risk_ops' | 'analyst'

export interface DemoUser {
  email: string
  password: string
  name: string
  role: UserRole
}

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
    email: 'admin@hytech.com',
    password: 'AdminDemo2026!',
    name: 'Risk Admin',
    role: 'admin',
  },
]

/** Hytech org emails used across V Exchange tooling. */
export function isHytechEmail(email: string): boolean {
  const e = email.trim().toLowerCase()
  return /@(hytech\.com|hytechc\.com|hytechpro\.com)$/i.test(e)
}

export function authenticate(email: string, password: string): DemoUser | null {
  const e = email.trim().toLowerCase()
  if (!isHytechEmail(e)) return null
  const user = DEMO_USERS.find((u) => u.email.toLowerCase() === e)
  if (!user || user.password !== password) return null
  return user
}
