/**
 * Auth — sign in / create account against Supabase auth. When Supabase isn't
 * configured, shows a helpful message instead of a broken form. On success
 * redirects to the page the visitor originally tried to reach (or /trading).
 */
import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Database, LogIn, UserPlus } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import { Button, Card, CardContent, CardHeader, CardTitle, Input } from '../components/ui'

export function Auth() {
  const { user, loading, signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/trading'

  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  // Already signed in? Send them to the app.
  if (!loading && user) {
    navigate(from, { replace: true })
    return null
  }

  const submit = async () => {
    if (!email.trim() || password.length < 6) {
      setError('Enter a valid email and a password of at least 6 characters.')
      return
    }
    setBusy(true)
    setError(null)
    setInfo(null)
    if (mode === 'signin') {
      const { error: signInError } = await signIn(email.trim(), password)
      setBusy(false)
      if (signInError) {
        setError(
          signInError.toLowerCase().includes('invalid login')
            ? 'That email/password combination is wrong — check and try again.'
            : signInError,
        )
        return
      }
      navigate(from, { replace: true })
      return
    }
    const { error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { emailRedirectTo: window.location.origin },
    })
    setBusy(false)
    if (signUpError) {
      setError(signUpError.message)
      return
    }
    setInfo('Account created! Check your inbox to confirm your email, then sign in.')
    setMode('signin')
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <Card>
        <CardHeader className="mb-2">
          <CardTitle className="text-xl">
            {mode === 'signin' ? 'Welcome back' : 'Create your account'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!isSupabaseConfigured && (
            <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
              <Database className="mt-0.5 h-5 w-5 shrink-0 text-accent" aria-hidden="true" />
              <div>
                <p className="font-medium text-foreground">Authentication is not configured yet</p>
                <p className="mt-1">
                  Link a Supabase project to enable sign-in. You'll be able to create an account as
                  soon as it's connected.
                </p>
              </div>
            </div>
          )}

          {isSupabaseConfigured && (
            <>
              <div className="mb-4 grid grid-cols-2 gap-2" role="tablist" aria-label="Auth mode">
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === 'signin'}
                  onClick={() => {
                    setMode('signin')
                    setError(null)
                  }}
                  className={
                    mode === 'signin'
                      ? 'flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-accent bg-accent/15 px-3 py-2 text-sm font-semibold text-accent'
                      : 'flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-muted-foreground'
                  }
                >
                  <LogIn className="h-4 w-4" aria-hidden="true" /> Sign in
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === 'signup'}
                  onClick={() => {
                    setMode('signup')
                    setError(null)
                  }}
                  className={
                    mode === 'signup'
                      ? 'flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-accent bg-accent/15 px-3 py-2 text-sm font-semibold text-accent'
                      : 'flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-muted-foreground'
                  }
                >
                  <UserPlus className="h-4 w-4" aria-hidden="true" /> Create account
                </button>
              </div>

              <div className="space-y-3">
                <Input
                  label="Email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
                <Input
                  label="Password"
                  type="password"
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>

              {error && (
                <p role="alert" className="mt-3 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                  {error}
                </p>
              )}
              {info && (
                <p role="status" className="mt-3 rounded-lg border border-up/40 bg-up/10 px-3 py-2 text-xs text-up">
                  {info}
                </p>
              )}

              <Button className="mt-4 w-full" size="lg" loading={busy} onClick={() => void submit()}>
                {mode === 'signin' ? 'Sign in' : 'Create account'}
              </Button>

              <p className="mt-4 text-center text-xs text-muted-foreground">
                By continuing you agree to trade at your own risk. Paper trading is free and requires
                no card.
              </p>
            </>
          )}

          <div className="mt-4 text-center text-sm text-muted-foreground">
            Need help? <Link to="/help" className="text-accent hover:underline">Read the FAQ</Link>.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
