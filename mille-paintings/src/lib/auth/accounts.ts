import { hashPassword, isValidEmail, normalizeEmail, randomSaltHex, verifyPassword } from './crypto'

const ACCOUNTS_KEY = 'mille.accounts'
const SESSION_KEY = 'mille.session'

export type LocalAccount = {
  id: string
  email: string
  salt: string
  hash: string
  createdAt: string
}

export type SessionUser = {
  id: string
  email: string
}

type AccountMap = Record<string, LocalAccount>

function readAccounts(): AccountMap {
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as AccountMap
  } catch {
    return {}
  }
}

function writeAccounts(map: AccountMap) {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(map))
}

export function getSession(): SessionUser | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as SessionUser
    if (!parsed?.id || !parsed?.email) return null
    return parsed
  } catch {
    return null
  }
}

export function setSession(user: SessionUser | null) {
  if (!user) localStorage.removeItem(SESSION_KEY)
  else localStorage.setItem(SESSION_KEY, JSON.stringify(user))
}

export async function signUpLocal(email: string, password: string): Promise<SessionUser> {
  const normalized = normalizeEmail(email)
  if (!isValidEmail(normalized)) throw new Error('invalid_email')
  if (password.length < 8) throw new Error('weak_password')

  const accounts = readAccounts()
  if (accounts[normalized]) throw new Error('email_taken')

  const salt = await randomSaltHex()
  const hash = await hashPassword(password, salt)
  const id =
    typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `u_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`

  const account: LocalAccount = {
    id,
    email: normalized,
    salt,
    hash,
    createdAt: new Date().toISOString(),
  }
  accounts[normalized] = account
  writeAccounts(accounts)

  const session = { id, email: normalized }
  setSession(session)
  return session
}

export async function signInLocal(email: string, password: string): Promise<SessionUser> {
  const normalized = normalizeEmail(email)
  const account = readAccounts()[normalized]
  if (!account) throw new Error('invalid_credentials')
  const ok = await verifyPassword(password, account.salt, account.hash)
  if (!ok) throw new Error('invalid_credentials')
  const session = { id: account.id, email: account.email }
  setSession(session)
  return session
}

export function signOutLocal() {
  setSession(null)
}
