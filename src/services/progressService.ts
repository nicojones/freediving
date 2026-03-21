import { queueCompletion, flushQueue, clearByPlanId } from './offlineQueue';

const API_BASE = '/api/progress';
const USER_BASE = '/api/user';

export interface Completion {
  plan_id: string;
  day_id: string;
  completed_at: number;
}

export type RecordCompletionResult = { ok: true } | { ok: true; queued: true } | { error: string };

export const recordCompletion = async (
  planId: string,
  dayId: string,
  dayIndex?: number
): Promise<RecordCompletionResult> => {
  if (!navigator.onLine) {
    await queueCompletion(planId, dayId, dayIndex);
    return { ok: true, queued: true };
  }

  const reqBody: Record<string, string | number> = { plan_id: planId, day_id: dayId };
  if (typeof dayIndex === 'number') {
    reqBody.day_index = dayIndex;
  }

  let res: Response;
  try {
    res = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reqBody),
      credentials: 'include',
    });
  } catch {
    return { error: 'Network error — is the server running? (npm run server)' };
  }
  if (res.ok) {
    const data = await res.json();
    return { ok: data.ok };
  }
  if (res.status === 401) {
    return { error: 'Session expired — please log in again' };
  }
  const errBody = (await res.json().catch(() => ({}))) as { error?: string };
  const msg = errBody?.error ?? `Failed to record completion (${res.status})`;
  return { error: msg };
};

export const flushOfflineQueue = async (): Promise<void> => {
  await flushQueue();
};

export const fetchCompletions = async (planId: string = 'default'): Promise<Completion[]> => {
  const res = await fetch(`${API_BASE}?plan_id=${encodeURIComponent(planId)}`, {
    credentials: 'include',
  });
  if (res.ok) {
    const data = await res.json();
    return data.completions ?? [];
  }
  return [];
};

/**
 * Fetches the active plan ID. Server auto-sets default when none exists.
 * Returns null only on 404 (no plans available) or other errors.
 */
export const fetchActivePlan = async (): Promise<string | null> => {
  const res = await fetch(`${USER_BASE}/active-plan`, { credentials: 'include' });
  if (res.ok) {
    const data = await res.json();
    return data.plan_id ?? null;
  }
  return null;
};

export const setActivePlan = async (
  planId: string
): Promise<{ ok: boolean } | { error: string }> => {
  try {
    const res = await fetch(`${USER_BASE}/active-plan`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan_id: planId }),
      credentials: 'include',
    });
    if (res.ok) {
      return { ok: true };
    }
    if (res.status === 401) {
      return { error: 'Session expired — please log in again' };
    }
    const errBody = (await res.json().catch(() => ({}))) as { error?: string };
    return { error: errBody?.error ?? `Failed to set active plan (${res.status})` };
  } catch {
    return { error: 'Network error — is the server running?' };
  }
};

export const resetProgress = async (
  planId: string
): Promise<{ ok: boolean } | { error: string }> => {
  try {
    const res = await fetch(`${API_BASE}?plan_id=${encodeURIComponent(planId)}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!res.ok) {
      if (res.status === 401) {
        return { error: 'Session expired — please log in again' };
      }
      const errBody = (await res.json().catch(() => ({}))) as { error?: string };
      return { error: errBody?.error ?? `Failed to reset progress (${res.status})` };
    }
    await clearByPlanId(planId);
    return { ok: true };
  } catch {
    return { error: 'Network error — is the server running?' };
  }
};
