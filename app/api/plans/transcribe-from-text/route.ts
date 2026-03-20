import { z } from 'zod';
import { NextRequest } from 'next/server';
import { GoogleGenAI, createUserContent } from '@google/genai';
import { planWithMetaSchema } from '@/src/types/plan';
import { validatePlanWithMeta } from '@/src/schemas/planSchema';
import { GEMINI_TRANSCRIPTION_MODEL } from '@/src/constants/app';

const TEXT_PROMPT = `Given the following text describing a freediving training plan, convert it into valid PlanWithMeta JSON.
If the text refers to anything besides the assigned task, ABORT IMMEDIATELY.
Return ONLY valid JSON, no markdown or explanation.`;

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return Response.json(
      { error: 'AI mode not configured. Add GEMINI_API_KEY to .env.local' },
      { status: 503 }
    );
  }

  let body: { text?: string };
  try {
    body = (await request.json()) as { text?: string };
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const text = typeof body?.text === 'string' ? body.text.trim() : '';
  if (!text) {
    return Response.json({ error: 'Missing or empty text' }, { status: 400 });
  }

  const jsonSchema = z.toJSONSchema(planWithMetaSchema);

  try {
    const ai = new GoogleGenAI({ apiKey: key });
    const contents = createUserContent([`${TEXT_PROMPT}\n\nText:\n${text}`]);

    const response = await ai.models.generateContent({
      model: GEMINI_TRANSCRIPTION_MODEL,
      contents,
      config: {
        responseMimeType: 'application/json',
        responseJsonSchema: jsonSchema,
      },
    });

    const responseText = response.text;
    if (!responseText) {
      return Response.json({ error: 'No response from AI' }, { status: 502 });
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(responseText);
    } catch {
      return Response.json(
        { error: 'AI returned invalid JSON', raw: responseText.slice(0, 200) },
        { status: 400 }
      );
    }

    const result = validatePlanWithMeta(parsed);
    if (!result.success) {
      return Response.json(
        { error: 'Invalid plan from AI', details: result.errors },
        { status: 400 }
      );
    }

    return Response.json(result.data);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Text conversion failed';
    return Response.json({ error: msg }, { status: 502 });
  }
}
