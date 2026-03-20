import { describe, expect, it, vi, beforeEach } from 'vitest';

const mockPlan = {
  id: 'test-text-plan',
  name: 'Test Text Plan',
  days: [
    { id: 'd1', day: 1, phases: [{ type: 'hold', duration: 120 }] },
    { id: 'd2', day: 2, phases: [{ type: 'recovery', duration: 60 }] },
  ],
};

vi.mock('@google/genai', () => ({
  GoogleGenAI: class MockGoogleGenAI {
    models = {
      generateContent: vi.fn().mockResolvedValue({
        text: JSON.stringify(mockPlan),
      }),
    };
  },
  createUserContent: vi.fn((x: unknown[]) => x),
}));

describe('POST /api/plans/transcribe-from-text', () => {
  const originalKey = process.env.GEMINI_API_KEY;

  beforeEach(() => {
    process.env.GEMINI_API_KEY = 'test-key';
  });

  it('returns 503 when GEMINI_API_KEY is missing', async () => {
    process.env.GEMINI_API_KEY = '';
    const { POST } = await import('./route');
    const req = new Request('http://localhost/api/plans/transcribe-from-text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: '3 days of holds, 2 min each' }),
    });
    const res = await POST(req as import('next/server').NextRequest);
    expect(res.status).toBe(503);
    const data = await res.json();
    expect(data.error).toContain('AI mode not configured');
    process.env.GEMINI_API_KEY = originalKey;
  });

  it('returns 400 when text is missing', async () => {
    const { POST } = await import('./route');
    const req = new Request('http://localhost/api/plans/transcribe-from-text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const res = await POST(req as import('next/server').NextRequest);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('Missing or empty text');
  });

  it('returns 400 when text is empty string', async () => {
    const { POST } = await import('./route');
    const req = new Request('http://localhost/api/plans/transcribe-from-text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: '   ' }),
    });
    const res = await POST(req as import('next/server').NextRequest);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('Missing or empty text');
  });

  it('returns PlanWithMeta when text is valid and Gemini returns valid JSON', async () => {
    const { POST } = await import('./route');
    const req = new Request('http://localhost/api/plans/transcribe-from-text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: '3 days of holds, 2 min each, 2 min recovery' }),
    });
    const res = await POST(req as import('next/server').NextRequest);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.id).toBe('test-text-plan');
    expect(data.name).toBe('Test Text Plan');
    expect(data.days).toHaveLength(2);
  });
});
