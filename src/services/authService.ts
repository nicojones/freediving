const API_BASE = '/api/auth'

export interface User {
  id: number
  username: string
}

export async function login(
  username: string,
  password: string
): Promise<{ user: User } | { error: string }> {
  const res = await fetch(`${API_BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
    credentials: 'include',
  })
  if (res.ok) {
    const data = await res.json()
    return { user: data.user }
  }
  if (res.status === 401) {
    return { error: 'Invalid credentials' }
  }
  return { error: 'Login failed' }
}

export async function logout(): Promise<void> {
  await fetch(`${API_BASE}/logout`, {
    method: 'POST',
    credentials: 'include',
  })
}

export async function getCurrentUser(): Promise<User | null> {
  const res = await fetch(`${API_BASE}/me`, { credentials: 'include' })
  if (res.ok) {
    const data = await res.json()
    return data.user
  }
  return null
}
