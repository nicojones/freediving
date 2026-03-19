import { useState } from 'react'
import clsx from 'clsx'
import { login } from '../services/authService'

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
    <main className="p-8 max-w-[400px] mx-auto">
      <h1>Freediving Breathhold Trainer</h1>
      <p>Sign in to continue</p>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="username" className="block mb-1">
            Username
          </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            required
            className="w-full p-2"
          />
        </div>
        <div className="mb-4">
          <label htmlFor="password" className="block mb-1">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
            className="w-full p-2"
          />
        </div>
        {error && (
          <p className="text-[crimson] mb-4">{error}</p>
        )}
        <button
          type="submit"
          disabled={loading}
          className={clsx('px-4 py-2', loading && 'opacity-50 cursor-not-allowed')}
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </main>
  )
}
