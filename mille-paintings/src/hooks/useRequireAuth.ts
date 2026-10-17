import { useCallback, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../data/AuthProvider'
import type { LoginPromptReason } from '../components/LoginPrompt'

type PromptState = {
  open: boolean
  reason: LoginPromptReason
}

/**
 * Gate save-worthy actions (collect / preference edits) behind sign-in.
 * Returns false when the caller should abort; opens a login prompt instead.
 */
export function useRequireAuth() {
  const { user, ready } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [prompt, setPrompt] = useState<PromptState>({ open: false, reason: 'collect' })

  const requireAuth = useCallback(
    (reason: LoginPromptReason): boolean => {
      if (!ready) return false
      if (user) return true
      setPrompt({ open: true, reason })
      return false
    },
    [ready, user],
  )

  const closePrompt = useCallback(() => {
    setPrompt((p) => ({ ...p, open: false }))
  }, [])

  const goSignIn = useCallback(() => {
    const next = `${location.pathname}${location.search}${location.hash}`
    setPrompt((p) => ({ ...p, open: false }))
    navigate('/account', {
      state: {
        next: next.startsWith('/') ? next : `/${next}`,
        reason: prompt.reason,
      },
    })
  }, [location.hash, location.pathname, location.search, navigate, prompt.reason])

  return {
    user,
    ready,
    requireAuth,
    promptOpen: prompt.open,
    promptReason: prompt.reason,
    closePrompt,
    goSignIn,
  }
}
