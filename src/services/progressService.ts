const API_BASE = '/api/progress'

export interface Completion {
  plan_id: string
  day_index: number
  completed_at: number
}

export async function recordCompletion(
  planId: string,
  dayIndex: number
): Promise<{ ok: boolean } | { error: string }> {
  const res = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ plan_id: planId, day_index: dayIndex }),
    credentials: 'include',
  })
  if (res.ok) {
    const data = await res.json()
    return { ok: data.ok }
  }
  return { error: 'Failed to record completion' }
}

export async function fetchCompletions(
  planId: string = 'default'
): Promise<Completion[]> {
  const res = await fetch(`${API_BASE}?plan_id=${encodeURIComponent(planId)}`, {
    credentials: 'include',
  })
  if (res.ok) {
    const data = await res.json()
    return data.completions ?? []
  }
  return []
}
