import { NextRequest } from 'next/server'
import {
  GoogleGenAI,
  createPartFromBase64,
  createUserContent,
} from '@google/genai'
import { validatePlanWithMeta } from '@/src/schemas/planSchema'
import { GEMINI_TRANSCRIPTION_MODEL } from '@/src/constants/app'

export const runtime = 'nodejs'

const PROMPT = `Convert this audio (user dictating a freediving training plan) into valid PlanWithMeta JSON.
Schema: { id: string, name: string, description?: string, days: array }
Each day: TrainingDay { id, day, group?, phases: [{ type: 'hold'|'recovery', duration: number }], type?: 'dry'|'wet' } OR RestDay { id, day, group?, rest: true } OR null.
Return ONLY valid JSON, no markdown or explanation.`

export async function POST(request: NextRequest) {
  const key = process.env.GEMINI_API_KEY
  if (!key) {
    return Response.json(
      { error: 'AI mode not configured. Add GEMINI_API_KEY to .env.local' },
      { status: 503 }
    )
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return Response.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const file = formData.get('audio') as File | null
  if (!file || !(file instanceof Blob)) {
    return Response.json({ error: 'No audio file' }, { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const base64 = buffer.toString('base64')
  const mimeType = (file.type || 'audio/webm') as
    | 'audio/webm'
    | 'audio/mp3'
    | 'audio/wav'
    | 'audio/ogg'

  try {
    const ai = new GoogleGenAI({ apiKey: key })
    const audioPart = createPartFromBase64(base64, mimeType)
    const contents = createUserContent([audioPart, PROMPT])

    const response = await ai.models.generateContent({
      model: GEMINI_TRANSCRIPTION_MODEL,
      contents,
      config: { responseMimeType: 'application/json' },
    })

    const text = response.text
    if (!text) {
      return Response.json({ error: 'No response from AI' }, { status: 502 })
    }

    let parsed: unknown
    try {
      parsed = JSON.parse(text)
    } catch {
      return Response.json(
        { error: 'AI returned invalid JSON', raw: text.slice(0, 200) },
        { status: 400 }
      )
    }

    const result = validatePlanWithMeta(parsed)
    if (!result.success) {
      return Response.json(
        { error: 'Invalid plan from AI', details: result.errors },
        { status: 400 }
      )
    }

    return Response.json(result.data)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Transcription failed'
    return Response.json({ error: msg }, { status: 502 })
  }
}
