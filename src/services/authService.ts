const API_BASE = '/api/auth';

export interface User {
  id: number;
  username: string;
  email?: string | null;
}

export async function logout(): Promise<void> {
  await fetch(`${API_BASE}/logout`, {
    method: 'POST',
    credentials: 'include',
  });
}

export async function requestMagicLink(
  email: string
): Promise<{ message?: string } | { error: string }> {
  const res = await fetch(`${API_BASE}/request-magic-link`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
    credentials: 'include',
  });
  if (res.ok) {
    const data = await res.json();
    return { message: data.message };
  }
  if (res.status === 429) {
    return { error: 'Too many attempts. Try again later.' };
  }
  if (res.status === 503) {
    return { error: 'Unable to send sign-in link. Please try again later.' };
  }
  const data = await res.json().catch(() => ({}));
  return { error: (data as { error?: string }).error || 'Request failed' };
}

export async function getCurrentUser(): Promise<User | null> {
  const res = await fetch(`${API_BASE}/me`, { credentials: 'include' });
  if (res.ok) {
    const data = await res.json();
    return data.user;
  }
  return null;
}
