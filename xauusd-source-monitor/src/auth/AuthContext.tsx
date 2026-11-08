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
  role: UserRole | null
  isAdmin: boolean
  login: (email: string, password: string) => { ok: true } | { ok: false; error: string }
  logout: () => void
}

const Ctx = createContext<AuthCtx | null>(null)

function readSession(): AuthSession | null {
  try {
    // Forever session: localStorage only (survives tab/browser restarts). No expiry.
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as AuthSession
    if (!parsed?.email || !parsed?.role) return null
    return parsed
  } catch {
    return null
  }
}

function writeSession(session: AuthSession | null) {
  try {
    // Drop any legacy sessionStorage copy so logout/login stay consistent.
    sessionStorage.removeItem(SESSION_KEY)
    if (!session) {
      localStorage.removeItem(SESSION_KEY)
      return
    }
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
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
    writeSession(session)
    setUser(session)
    return { ok: true as const }
  }, [])

  const logout = useCallback(() => {
    writeSession(null)
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      role: user?.role ?? null,
      isAdmin: user?.role === 'admin',
      login,
      logout,
    }),
    [user, login, logout],
  )
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useAuth() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useAuth requires AuthProvider')
  return ctx
}
