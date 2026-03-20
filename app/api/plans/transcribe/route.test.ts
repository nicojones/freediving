import { describe, expect, it, vi, beforeEach } from 'vitest';

const mockPlan = {
  id: 'test-transcribe',
  name: 'Test Transcribe Plan',
  days: [{ id: 'd1', day: 1, phases: [{ type: 'hold', duration: 90 }] }],
};

vi.mock('@google/genai', () => ({
  GoogleGenAI: class MockGoogleGenAI {
    models = {
      generateContent: vi.fn().mockResolvedValue({
        text: JSON.stringify(mockPlan),
      }),
    };
  },
  createPartFromBase64: vi.fn(() => ({})),
  createUserContent: vi.fn((x: unknown[]) => x),
}));

describe('POST /api/plans/transcribe', () => {
  const originalKey = process.env.GEMINI_API_KEY;

  beforeEach(() => {
    process.env.GEMINI_API_KEY = 'test-key';
  });

  it('returns 503 when GEMINI_API_KEY is missing', async () => {
    process.env.GEMINI_API_KEY = '';
    const { POST } = await import('./route');
    const formData = new FormData();
    formData.append('audio', new Blob(['fake-audio'], { type: 'audio/webm' }));
    const req = new Request('http://localhost/api/plans/transcribe', {
      method: 'POST',
      body: formData,
    });
    const res = await POST(req as import('next/server').NextRequest);
    expect(res.status).toBe(503);
    const data = await res.json();
    expect(data.error).toContain('AI mode not configured');
    process.env.GEMINI_API_KEY = originalKey;
  });

  it('returns 400 when no audio file', async () => {
    const { POST } = await import('./route');
    const formData = new FormData();
    const req = new Request('http://localhost/api/plans/transcribe', {
      method: 'POST',
      body: formData,
    });
    const res = await POST(req as import('next/server').NextRequest);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('No audio file');
  });

  it('returns PlanWithMeta when audio is valid and Gemini returns valid JSON', async () => {
    const formData = new FormData();
    formData.append('audio', new File(['fake-audio'], 'audio.webm', { type: 'audio/webm' }));
    const req = {
      formData: () => Promise.resolve(formData),
    } as unknown as import('next/server').NextRequest;
    const { POST } = await import('./route');
    const res = await POST(req);
    const data = await res.json();
    if (res.status !== 200) {
      expect.fail(`Expected 200, got ${res.status}: ${JSON.stringify(data)}`);
    }
    expect(data.id).toBe('test-transcribe');
    expect(data.name).toBe('Test Transcribe Plan');
    expect(data.days).toHaveLength(1);
  });
});
