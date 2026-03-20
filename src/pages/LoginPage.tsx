import { useState } from 'react'
import { login } from '../services/authService'
import { FishIcon } from '../components/FishIcon'
import { TextInput } from '../components/TextInput'
import { PrimaryButton } from '../components/PrimaryButton'

interface LoginPageProps {
  onLoginSuccess: () => void
}

export function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const result = await login(username, password)
    setLoading(false)
    if ('user' in result) {
      onLoginSuccess()
    } else {
      setError(result.error)
    }
  }

  return (
    <>
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 abyssal-gradient" />
      <div className="absolute top-[-10%] left-[-10%] w-[120%] h-[120%] opacity-20 bg-gradient-to-b from-primary/5 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-background to-transparent" />
    </div>
    <main className="relative z-10 w-full min-h-screen flex flex-col items-center justify-center px-10 selection:bg-primary selection:text-on-primary">
      <div className="w-full max-w-md flex flex-col items-center">
        <header className="mb-20 text-center flex flex-col items-center">
          <div className="mb-6 flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary border border-primary/20">
            <FishIcon className="text-primary" size={40} aria-hidden />
          </div>
          <h1 className="font-headline text-[3.5rem] font-bold tracking-tight text-primary leading-none mb-2">
            Fishly
          </h1>
          <p className="font-label text-on-surface-variant tracking-[0.2em] uppercase text-[0.65rem] font-medium">
            Breathhold Protocol
          </p>
        </header>

        <form onSubmit={handleSubmit} className="w-full space-y-8">
          <div className="space-y-6">
            <TextInput
              id="username"
              label="Username"
              type="text"
              value={username}
              onChange={setUsername}
              placeholder="Diver Identifier"
              autoComplete="username"
              icon="person"
              data-testid="login-username"
            />
            <TextInput
              id="password"
              label="Password"
              type="password"
              value={password}
              onChange={setPassword}
              placeholder="••••••••"
              autoComplete="current-password"
              icon="key"
              data-testid="login-password"
            />
          </div>
          {error && (
            <p data-testid="login-error" className="text-error text-sm font-body">{error}</p>
          )}
          <PrimaryButton
            data-testid="login-submit"
            type="submit"
            disabled={loading}
            loading={loading}
            size="login"
            icon="arrow_forward"
          >
            Start Training
          </PrimaryButton>
        </form>

        <footer className="mt-24 text-center">
          <p className="font-label text-on-surface-variant/40 text-[0.6rem] uppercase tracking-widest">
            Version 2.0.4 • Deep Flow Encrypted
          </p>
        </footer>
      </div>

      <div className="fixed top-20 right-20 w-32 h-32 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
      <div className="fixed bottom-40 left-10 w-48 h-48 rounded-full bg-secondary/5 blur-3xl pointer-events-none" />
    </main>
    </>
  )
}
