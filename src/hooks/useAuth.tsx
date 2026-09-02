/**
 * Auth context for the ANA24 app. Wraps the Supabase auth session and exposes
 * sign-in / sign-out / password-update helpers in a small, typed surface the
 * pages consume. When Supabase isn't configured the context degrades to a
 * signed-out state so the rest of the app never crashes.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { User } from '@supabase/supabase-js'
import { isSupabaseConfigured, supabase } from '../lib/supabase'

interface AuthContextValue {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  updatePassword: (newPassword: string) => Promise<string | null>
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: false,
  signIn: async () => ({ error: 'Service not configured.' }),
  signOut: async () => {},
  updatePassword: async () => 'Service not configured.',
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false)
      return
    }
    let active = true
    void supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      setUser(data.session?.user ?? null)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })
    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    if (!isSupabaseConfigured) return { error: 'Service not configured.' }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error?.message ?? null }
  }, [])

  const signOut = useCallback(async () => {
    if (isSupabaseConfigured) await supabase.auth.signOut()
  }, [])

  const updatePassword = useCallback(async (newPassword: string) => {
    if (!isSupabaseConfigured) return 'Service not configured.'
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    return error?.message ?? null
  }, [])

  const value = useMemo(
    () => ({ user, loading, signIn, signOut, updatePassword }),
    [user, loading, signIn, signOut, updatePassword],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext)
}
