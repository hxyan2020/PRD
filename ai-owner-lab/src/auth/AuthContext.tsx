import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { notebookStore } from '../hooks/notebookStore'
import {
  fetchAccountMe,
  isVercelNotebookHost,
  loadCachedAccountUser,
  loginAccount,
  logoutAccount,
  registerAccount,
  saveAccountSyncEnabled,
  saveCachedAccountUser,
} from '../lib/notebookAccountSync'

type AuthContextValue = {
  available: boolean
  loading: boolean
  username: string | null
  error: string | null
  login: (username: string, password: string) => Promise<void>
  register: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  clearError: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const available = isVercelNotebookHost()
  const [loading, setLoading] = useState(available)
  const [username, setUsername] = useState<string | null>(() =>
    available ? loadCachedAccountUser() : null,
  )
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!available) {
      setLoading(false)
      return
    }
    let cancelled = false
    void (async () => {
      try {
        const me = await fetchAccountMe()
        if (cancelled) return
        if (me?.username) {
          setUsername(me.username)
          saveCachedAccountUser(me.username)
          saveAccountSyncEnabled(true)
          // Soft pull if already signed in on this browser.
          try {
            await notebookStore.enableAccountCloudSync({
              username: me.username,
              allowCreateEmpty: true,
            })
          } catch {
            /* empty cloud on first visit is fine */
          }
        } else {
          setUsername(null)
          saveCachedAccountUser(null)
          saveAccountSyncEnabled(false)
          notebookStore.disableAccountCloudSync()
        }
      } catch {
        if (!cancelled) {
          /* keep cached username offline; sync will retry later */
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [available])

  const afterAuth = useCallback(async (user: string) => {
    setUsername(user)
    saveCachedAccountUser(user)
    saveAccountSyncEnabled(true)
    await notebookStore.enableAccountCloudSync({
      username: user,
      allowCreateEmpty: true,
    })
  }, [])

  const login = useCallback(
    async (user: string, password: string) => {
      setError(null)
      const result = await loginAccount(user, password)
      await afterAuth(result.username)
    },
    [afterAuth],
  )

  const register = useCallback(
    async (user: string, password: string) => {
      setError(null)
      const result = await registerAccount(user, password)
      await afterAuth(result.username)
    },
    [afterAuth],
  )

  const logout = useCallback(async () => {
    setError(null)
    await logoutAccount()
    notebookStore.disableAccountCloudSync()
    setUsername(null)
  }, [])

  const value = useMemo(
    () => ({
      available,
      loading,
      username,
      error,
      login,
      register,
      logout,
      clearError: () => setError(null),
    }),
    [available, loading, username, error, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
