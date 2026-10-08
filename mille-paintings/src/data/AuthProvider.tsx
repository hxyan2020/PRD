import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { getSession, signInLocal, signOutLocal, signUpLocal, type SessionUser } from '../lib/auth/accounts'
import { isCloudSyncEnabled, pullCloudLibrary, pushCloudLibrary } from '../lib/auth/cloud'
import {
  exportLibrarySnapshot,
  importLibrarySnapshot,
  migrateGuestLibraryIfEmpty,
  setActiveStorageUserId,
} from '../lib/storage'

type AuthCtx = {
  user: SessionUser | null
  ready: boolean
  cloudEnabled: boolean
  syncing: boolean
  signUp: (email: string, password: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  persistLibrary: () => Promise<void>
}

const AuthContext = createContext<AuthCtx | null>(null)

async function activateUser(user: SessionUser | null) {
  setActiveStorageUserId(user?.id ?? null)
  if (!user) return

  migrateGuestLibraryIfEmpty()

  if (isCloudSyncEnabled()) {
    try {
      const remote = await pullCloudLibrary(user.id)
      const local = exportLibrarySnapshot()
      if (remote) {
        const remoteTime = Date.parse(remote.updatedAt || '') || 0
        const localTime = Date.parse(local.updatedAt || '') || 0
        const remoteWeight =
          remote.viewed.length + remote.collected.length + remote.extras.length
        const localWeight = local.viewed.length + local.collected.length + local.extras.length
        // Prefer the richer snapshot; break ties with newer timestamp.
        if (remoteWeight > localWeight || (remoteWeight === localWeight && remoteTime >= localTime)) {
          importLibrarySnapshot(remote)
        } else {
          await pushCloudLibrary(user.id, local)
        }
      } else {
        await pushCloudLibrary(user.id, local)
      }
    } catch {
      // Offline / misconfigured cloud — keep local user library.
    }
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null)
  const [ready, setReady] = useState(false)
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const session = getSession()
      if (session) {
        await activateUser(session)
        if (!cancelled) setUser(session)
      } else {
        setActiveStorageUserId(null)
      }
      if (!cancelled) setReady(true)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const persistLibrary = useCallback(async () => {
    if (!user || !isCloudSyncEnabled()) return
    setSyncing(true)
    try {
      await pushCloudLibrary(user.id, exportLibrarySnapshot())
    } finally {
      setSyncing(false)
    }
  }, [user])

  const signUp = useCallback(async (email: string, password: string) => {
    setSyncing(true)
    try {
      const session = await signUpLocal(email, password)
      await activateUser(session)
      setUser(session)
      window.dispatchEvent(new CustomEvent('mille:auth-changed'))
    } finally {
      setSyncing(false)
    }
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    setSyncing(true)
    try {
      const session = await signInLocal(email, password)
      await activateUser(session)
      setUser(session)
      window.dispatchEvent(new CustomEvent('mille:auth-changed'))
    } finally {
      setSyncing(false)
    }
  }, [])

  const signOut = useCallback(async () => {
    if (user && isCloudSyncEnabled()) {
      try {
        await pushCloudLibrary(user.id, exportLibrarySnapshot())
      } catch {
        /* keep going */
      }
    }
    signOutLocal()
    setActiveStorageUserId(null)
    setUser(null)
    window.dispatchEvent(new CustomEvent('mille:auth-changed'))
  }, [user])

  const value = useMemo<AuthCtx>(
    () => ({
      user,
      ready,
      cloudEnabled: isCloudSyncEnabled(),
      syncing,
      signUp,
      signIn,
      signOut,
      persistLibrary,
    }),
    [user, ready, syncing, signUp, signIn, signOut, persistLibrary],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth requires AuthProvider')
  return ctx
}
