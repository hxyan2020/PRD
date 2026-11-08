import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { authenticate, type DemoUser, type UserRole } from './users'

const SESSION_KEY = 'vex_risk_tool_session_v1'

export interface AuthSession {
  email: string
  name: string
  role: UserRole
  loggedInAt: number
}

type AuthCtx = {
  user: AuthSession | null
  login: (email: string, password: string) => { ok: true } | { ok: false; error: string }
  logout: () => void
}

const Ctx = createContext<AuthCtx | null>(null)

function readSession(): AuthSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    return JSON.parse(raw) as AuthSession
  } catch {
    return null
  }
}

function writeSession(session: AuthSession | null, persist: boolean) {
  try {
    sessionStorage.removeItem(SESSION_KEY)
    localStorage.removeItem(SESSION_KEY)
    if (session) {
      const raw = JSON.stringify(session)
      sessionStorage.setItem(SESSION_KEY, raw)
      if (persist) localStorage.setItem(SESSION_KEY, raw)
    }
  } catch {
    /* ignore */
  }
}

function toSession(user: DemoUser): AuthSession {
  return {
    email: user.email,
    name: user.name,
    role: user.role,
    loggedInAt: Date.now(),
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthSession | null>(() => readSession())

  const login = useCallback((email: string, password: string) => {
    const found = authenticate(email, password)
    if (!found) {
      if (!/@/.test(email.trim())) {
        return { ok: false as const, error: 'invalid_email' }
      }
      return { ok: false as const, error: 'auth_failed' }
    }
    const session = toSession(found)
    writeSession(session, true)
    setUser(session)
    return { ok: true as const }
  }, [])

  const logout = useCallback(() => {
    writeSession(null, false)
    setUser(null)
  }, [])

  const value = useMemo(() => ({ user, login, logout }), [user, login, logout])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useAuth() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useAuth requires AuthProvider')
  return ctx
}
