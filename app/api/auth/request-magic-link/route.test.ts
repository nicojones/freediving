import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('@/lib/db', () => ({ initDb: vi.fn().mockResolvedValue(undefined) }));
vi.mock('@/lib/db.config', () => ({
  getDbConnection: vi.fn().mockResolvedValue([
    {
      execute: vi
        .fn()
        .mockResolvedValueOnce([[]]) // SELECT user - not found
        .mockResolvedValueOnce([[]]) // SELECT username - available
        .mockResolvedValueOnce([undefined]) // INSERT user
        .mockResolvedValueOnce([[{ id: 1, username: 'test' }]]) // SELECT inserted
        .mockResolvedValueOnce([undefined]), // INSERT token
      query: vi.fn(),
    },
    vi.fn(), // release
  ]),
}));
vi.mock('@/lib/email', () => ({ sendMagicLink: vi.fn().mockResolvedValue(undefined) }));

const mockCheckLimit = vi.fn();
const mockRecordAttempt = vi.fn();
vi.mock('@/lib/rateLimit', () => ({
  checkLimit: (...args: unknown[]) => mockCheckLimit(...args),
  recordAttempt: (...args: unknown[]) => mockRecordAttempt(...args),
}));

describe('POST /api/auth/request-magic-link', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCheckLimit.mockReturnValue(true);
  });

  it('returns 400 for invalid email', async () => {
    const { POST } = await import('./route');
    const req = new Request('http://localhost/api/auth/request-magic-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'not-an-email' }),
    });
    const res = await POST(req as import('next/server').NextRequest);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('Invalid email');
  });

  it('returns 429 when rate limited', async () => {
    mockCheckLimit.mockReturnValue(false);
    const { POST } = await import('./route');
    const req = new Request('http://localhost/api/auth/request-magic-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com' }),
    });
    const res = await POST(req as import('next/server').NextRequest);
    expect(res.status).toBe(429);
    const data = await res.json();
    expect(data.error).toBe('Too many attempts. Try again later.');
  });
});
