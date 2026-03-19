import { useState } from 'react'
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
    <main style={{ padding: '2rem', maxWidth: 400, margin: '0 auto' }}>
      <h1>Freediving Breathhold Trainer</h1>
      <p>Sign in to continue</p>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="username" style={{ display: 'block', marginBottom: 4 }}>
            Username
          </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            required
            style={{ width: '100%', padding: 8 }}
          />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="password" style={{ display: 'block', marginBottom: 4 }}>
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
            style={{ width: '100%', padding: 8 }}
          />
        </div>
        {error && (
          <p style={{ color: 'crimson', marginBottom: '1rem' }}>{error}</p>
        )}
        <button type="submit" disabled={loading} style={{ padding: '8px 16px' }}>
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </main>
  )
}
