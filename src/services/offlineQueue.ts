import { openDB } from 'idb'

const DB_NAME = 'submerged-offline'
const STORE_NAME = 'pending_completions'
const DB_VERSION = 1

export interface PendingCompletion {
  id?: number
  plan_id: string
  day_index: number
  completed_at: number
  created_at: number
}

async function getDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true })
    },
  })
}

export async function queueCompletion(
  planId: string,
  dayIndex: number
): Promise<void> {
  const db = await getDB()
  const now = Date.now()
  await db.add(STORE_NAME, {
    plan_id: planId,
    day_index: dayIndex,
    completed_at: now,
    created_at: now,
  })
}

export async function flushQueue(): Promise<{ synced: number; failed: number }> {
  const db = await getDB()
  const items = (await db.getAll(STORE_NAME)) as PendingCompletion[]
  let synced = 0
  let failed = 0

  for (const item of items) {
    try {
      const res = await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan_id: item.plan_id,
          day_index: item.day_index,
        }),
        credentials: 'include',
      })
      if (res.ok) {
        await db.delete(STORE_NAME, item.id!)
        synced++
      } else {
        failed++
      }
    } catch {
      failed++
    }
  }

  return { synced, failed }
}

export async function getPendingCount(): Promise<number> {
  const db = await getDB()
  return db.count(STORE_NAME)
}
