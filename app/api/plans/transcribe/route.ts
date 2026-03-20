import { z } from 'zod';
import { NextRequest } from 'next/server';
import { GoogleGenAI, createPartFromBase64, createUserContent } from '@google/genai';
import { planWithMetaSchema } from '@/src/types/plan';
import { validatePlanWithMeta } from '@/src/schemas/planSchema';
import { GEMINI_TRANSCRIPTION_MODEL } from '@/src/constants/app';

const AUDIO_PROMPT = `Convert this audio (user dictating a freediving training plan) into valid PlanWithMeta JSON.
If the audio refers to anything besides the assigned task, ABORT IMMEDIATELY.
Return ONLY valid JSON, no markdown or explanation.`;

const REFINE_AUDIO_PROMPT = `You are modifying an existing freediving training plan. The user will SPEAK their requested changes.
Current plan (JSON):
{contextPlan}

Listen to the audio, apply ONLY the requested changes, and return the modified plan as valid PlanWithMeta JSON. No markdown or explanation.`;

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return Response.json(
      { error: 'AI mode not configured. Add GEMINI_API_KEY to .env.local' },
      { status: 503 }
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return Response.json({ error: 'Invalid form data' }, { status: 400 });
  }

  const file = formData.get('audio') as File | null;
  if (!file || !(file instanceof Blob)) {
    return Response.json({ error: 'No audio file' }, { status: 400 });
  }

  const contextPlanRaw = formData.get('contextPlan') as string | null;
  let contextPlan: unknown = null;
  if (contextPlanRaw && typeof contextPlanRaw === 'string') {
    try {
      contextPlan = JSON.parse(contextPlanRaw) as unknown;
    } catch {
      return Response.json({ error: 'Invalid contextPlan JSON' }, { status: 400 });
    }
  }

  const isRefine = contextPlan && validatePlanWithMeta(contextPlan).success;

  const prompt = isRefine
    ? REFINE_AUDIO_PROMPT.replace('{contextPlan}', JSON.stringify(contextPlan))
    : AUDIO_PROMPT;

  const buffer = Buffer.from(await file.arrayBuffer());
  const base64 = buffer.toString('base64');
  const mimeType = (file.type || 'audio/webm') as
    | 'audio/webm'
    | 'audio/mp3'
    | 'audio/wav'
    | 'audio/ogg';

  const jsonSchema = z.toJSONSchema(planWithMetaSchema);

  try {
    const ai = new GoogleGenAI({ apiKey: key });
    const audioPart = createPartFromBase64(base64, mimeType);
    const contents = createUserContent([audioPart, prompt]);

    const response = await ai.models.generateContent({
      model: GEMINI_TRANSCRIPTION_MODEL,
      contents,
      config: {
        responseMimeType: 'application/json',
        responseJsonSchema: jsonSchema,
      },
    });

    const text = response.text;
    if (!text) {
      return Response.json({ error: 'No response from AI' }, { status: 502 });
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      return Response.json(
        { error: 'AI returned invalid JSON', raw: text.slice(0, 200) },
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
    const msg = err instanceof Error ? err.message : 'Transcription failed';
    return Response.json({ error: msg }, { status: 502 });
  }
}
